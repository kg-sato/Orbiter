//! Compatibility boundary for Scheduler snapshots. Native reward data is never imported.
use chrono::{Datelike, NaiveDate};
use serde_json::{json, Value};
use std::collections::HashSet;

pub fn empty_workspace() -> Value {
    json!({"template":[],"weeks":{},"study":{"tasks":[],"sessions":[],"preferences":{"name":"","goal":10,"motion":false,"solid":false},"timer":{"duration":25,"remaining":1500,"endAt":null,"title":"","taskId":null}}})
}
pub fn date(v: &Value) -> bool {
    v.as_str()
        .is_some_and(|s| NaiveDate::parse_from_str(s, "%Y-%m-%d").is_ok_and(|d| d.to_string() == s))
}
fn text(v: &Value, max: usize, required: bool) -> bool {
    v.as_str()
        .is_some_and(|s| s.chars().count() <= max && (!required || !s.trim().is_empty()))
}
fn number(v: &Value, min: f64, max: f64) -> bool {
    v.as_f64()
        .is_some_and(|n| n.is_finite() && n >= min && n <= max)
}
fn logs(v: &Value) -> bool {
    let Some(list) = v.as_array() else {
        return false;
    };
    let mut dates = HashSet::new();
    list.len() <= 366
        && list.iter().all(|l| {
            date(&l["date"])
                && dates.insert(l["date"].to_string())
                && l["minutes"]
                    .as_u64()
                    .is_some_and(|n| (1..=1440).contains(&n))
        })
}
fn clock(v: &Value) -> Option<u32> {
    let s = v.as_str()?;
    if !s.is_ascii() || s.len() != 5 || &s[2..3] != ":" {
        return None;
    }
    let h = s[..2].parse::<u32>().ok()?;
    let m = s[3..].parse::<u32>().ok()?;
    (h < 24 && m < 60 && m % 30 == 0).then_some(h * 60 + m)
}
fn events(v: &Value) -> bool {
    let Some(list) = v.as_array() else {
        return false;
    };
    let mut ids = HashSet::new();
    list.len() <= 5000
        && list.iter().all(|e| {
            text(&e["id"], 128, true)
                && ids.insert(e["id"].to_string())
                && text(&e["title"], 160, true)
                && text(&e["notes"], 5000, false)
                && e["day"].as_u64().is_some_and(|n| n <= 6)
                && clock(&e["start"])
                    .zip(clock(&e["end"]))
                    .is_some_and(|(s, t)| s >= 360 && t <= 1380 && t > s)
                && e["color"].as_str().is_some_and(|s| {
                    s.len() == 7
                        && s.starts_with('#')
                        && s[1..].chars().all(|c| c.is_ascii_hexdigit())
                })
                && (e.get("course").is_none() || text(&e["course"], 60, false))
                && (e.get("kind").is_none()
                    || matches!(
                        e["kind"].as_str(),
                        Some("class" | "study" | "work" | "personal" | "event")
                    ))
                && (e.get("repeatFrom").is_none() || monday(&e["repeatFrom"]))
        })
}
fn monday(v: &Value) -> bool {
    date(v)
        && NaiveDate::parse_from_str(v.as_str().unwrap(), "%Y-%m-%d")
            .unwrap()
            .weekday()
            .num_days_from_monday()
            == 0
}
pub fn validate_workspace(v: &Value) -> Result<(), String> {
    if serde_json::to_vec(v).map_err(|e| e.to_string())?.len() > 2 * 1024 * 1024 {
        return Err("Workspace exceeds 2 MB".into());
    }
    let fail = || Err("Invalid Scheduler workspace. Nothing was replaced.".to_string());
    if !v.as_object().is_some_and(|o| {
        o.keys()
            .all(|k| ["template", "weeks", "study"].contains(&k.as_str()))
    }) {
        return fail();
    }
    if !events(&v["template"]) {
        return fail();
    }
    let Some(weeks) = v["weeks"].as_object() else {
        return fail();
    };
    if weeks.len() > 520 || !weeks.iter().all(|(k, l)| monday(&json!(k)) && events(l)) {
        return fail();
    }
    let Some(s) = v.get("study") else {
        return Ok(());
    };
    if let Some(profiles) = s.get("catProfiles") {
        if !profiles.as_object().is_some_and(|p| {
            p.len() <= 20000
                && p.iter().all(|(name, code)| {
                    !name.is_empty()
                        && name.chars().count() <= 60
                        && code.as_u64().is_some_and(|c| c <= 65535)
                })
        }) {
            return fail();
        }
    }
    let Some(tasks) = s["tasks"].as_array() else {
        return fail();
    };
    let Some(sessions) = s["sessions"].as_array() else {
        return fail();
    };
    if tasks.len() > 5000 || sessions.len() > 30000 {
        return fail();
    }
    let mut ids = HashSet::new();
    for t in tasks {
        if !text(&t["id"], 128, true)
            || !ids.insert(t["id"].to_string())
            || !text(&t["title"], 160, true)
            || !text(&t["course"], 60, false)
            || !date(&t["due"])
            || !matches!(t["estimate"].as_u64(), Some(30 | 60 | 90 | 120))
            || !t["done"].is_boolean()
        {
            return fail();
        }
        if t.get("kind").is_some() && !matches!(t["kind"].as_str(), Some("assignment" | "exam")) {
            return fail();
        }
        if t["kind"] == "exam" && t.get("exam").is_none() {
            return fail();
        }
        if let Some(e) = t.get("exam") {
            if !e["targetMinutes"]
                .as_u64()
                .is_some_and(|n| (30..=12000).contains(&n))
                || !date(&e["startDate"])
                || (t["kind"] == "exam" && e["startDate"].as_str() > t["due"].as_str())
                || !logs(&e["logs"])
            {
                return fail();
            }
        }
        if let Some(r) = t.get("repeat") {
            if !matches!(
                r["frequency"].as_str(),
                Some("none" | "daily" | "weekdays" | "weekly")
            ) || !r["targetMinutes"]
                .as_u64()
                .is_some_and(|n| (5..=720).contains(&n))
                || !logs(&r["logs"])
            {
                return fail();
            }
        }
        if let Some(steps) = t.get("steps") {
            let Some(a) = steps.as_array() else {
                return fail();
            };
            let mut sid = HashSet::new();
            if a.len() > 20
                || !a.iter().all(|x| {
                    text(&x["id"], 100, true)
                        && sid.insert(x["id"].to_string())
                        && text(&x["title"], 120, true)
                        && matches!(x["minutes"].as_u64(), Some(30 | 60 | 90 | 120))
                        && x["done"].is_boolean()
                })
            {
                return fail();
            }
        }
    }
    if !sessions.iter().all(|x| {
        date(&x["date"])
            && number(&x["minutes"], 0.00001, 1440.0)
            && text(&x["title"], 160, false)
            && (x.get("taskId").is_none() || x["taskId"].is_null() || text(&x["taskId"], 128, true))
    }) {
        return fail();
    }
    let p = &s["preferences"];
    if !text(&p["name"], 40, false)
        || !p["goal"].as_u64().is_some_and(|n| (1..=80).contains(&n))
        || !p["motion"].is_boolean()
        || !p["solid"].is_boolean()
    {
        return fail();
    }
    for key in ["haptics", "reminders"] {
        if p.get(key).is_some() && !p[key].is_boolean() {
            return fail();
        }
    }
    if p.get("accent").is_some()
        && !matches!(p["accent"].as_str(), Some("mint" | "lilac" | "apricot"))
    {
        return fail();
    }
    if p.get("material").is_some()
        && !matches!(p["material"].as_str(), Some("sculpted" | "glass" | "quiet"))
    {
        return fail();
    }
    let start = p.get("studyStart").and_then(Value::as_u64).unwrap_or(540);
    let end = p.get("studyEnd").and_then(Value::as_u64).unwrap_or(1260);
    let target = p.get("dailyTarget").and_then(Value::as_u64).unwrap_or(180);
    if start < 360
        || end > 1380
        || end <= start
        || start % 30 != 0
        || end % 30 != 0
        || target < 30
        || target > 720
        || target % 30 != 0
    {
        return fail();
    }
    for key in ["studyStart", "studyEnd", "dailyTarget"] {
        if p.get(key).is_some() && p[key].as_u64().is_none() {
            return fail();
        }
    }
    if let Some(c) = s.get("courses") {
        let Some(a) = c.as_array() else { return fail() };
        if a.len() > 80
            || !a.iter().all(|x| {
                text(&x["name"], 60, true)
                    && text(&x["notes"], 5000, false)
                    && x["confidence"]
                        .as_u64()
                        .is_some_and(|n| (1..=5).contains(&n))
            })
        {
            return fail();
        }
    }
    if let Some(r) = s.get("reflections") {
        let Some(a) = r.as_array() else { return fail() };
        if a.len() > 260
            || !a.iter().all(|x| {
                monday(&x["week"]) && text(&x["win"], 1000, false) && text(&x["next"], 1000, false)
            })
        {
            return fail();
        }
    }
    let t = &s["timer"];
    if !t.is_object()
        || !t["duration"]
            .as_u64()
            .is_some_and(|n| (1..=240).contains(&n))
        || !number(&t["remaining"], 0.0, t["duration"].as_f64().unwrap() * 60.0)
        || !text(&t["title"], 160, false)
        || t.get("endAt").is_none()
        || !(t["endAt"].is_null() || number(&t["endAt"], 1.0, 1e16))
    {
        return fail();
    }
    Ok(())
}

/// Stable course identities are part of study exports; old snapshots remain valid.
pub fn ensure_cat_profiles(workspace: &mut Value) {
    use std::collections::BTreeSet;
    let mut names = BTreeSet::new();
    if let Some(courses) = workspace["study"]["courses"].as_array() {
        for c in courses {
            if let Some(n) = c["name"].as_str() {
                names.insert(n.to_string());
            }
        }
    }
    if let Some(tasks) = workspace["study"]["tasks"].as_array() {
        for t in tasks {
            if let Some(n) = t["course"].as_str() {
                if !n.is_empty() {
                    names.insert(n.to_string());
                }
            }
        }
    }
    if let Some(events) = workspace["template"].as_array() {
        for e in events {
            if let Some(n) = e["course"].as_str() {
                if !n.is_empty() {
                    names.insert(n.to_string());
                }
            }
        }
    }
    if let Some(weeks) = workspace["weeks"].as_object() {
        for events in weeks.values() {
            if let Some(events) = events.as_array() {
                for e in events {
                    if let Some(n) = e["course"].as_str() {
                        if !n.is_empty() {
                            names.insert(n.to_string());
                        }
                    }
                }
            }
        }
    }
    if workspace.get("study").is_none() {
        workspace["study"] = empty_workspace()["study"].clone();
    }
    let mut profiles = workspace["study"]["catProfiles"]
        .as_object()
        .cloned()
        .unwrap_or_default();
    let mut used: HashSet<u64> = profiles.values().filter_map(|v| v.as_u64()).collect();
    for name in names {
        if !profiles.contains_key(&name) {
            let hash = name
                .chars()
                .fold(7u32, |v, c| v.wrapping_mul(31).wrapping_add(c as u32));
            let mut code = (hash % 256) as u64;
            while used.contains(&code) {
                code = (code + 1) % 65536;
            }
            used.insert(code);
            profiles.insert(name, json!(code));
        }
    }
    workspace["study"]["catProfiles"] = Value::Object(profiles);
}

#[cfg(test)]
mod cat_tests {
    use super::*;
    #[test]
    fn course_profiles_are_unique_and_stable() {
        let mut w = empty_workspace();
        w["study"]["courses"] = json!([{"name":"PSY 401","notes":"keep","confidence":3},{"name":"MAT 221","notes":"","confidence":4}]);
        ensure_cat_profiles(&mut w);
        let first = w["study"]["catProfiles"].clone();
        assert_ne!(first["PSY 401"], first["MAT 221"]);
        ensure_cat_profiles(&mut w);
        assert_eq!(first, w["study"]["catProfiles"]);
        assert_eq!(w["study"]["courses"][0]["notes"], "keep");
        validate_workspace(&w).unwrap();
    }
    #[test]
    fn old_backup_and_profile_validation() {
        let mut w = empty_workspace();
        validate_workspace(&w).unwrap();
        w["study"]["catProfiles"] = json!({"PSY":70000});
        assert!(validate_workspace(&w).is_err());
    }
}
