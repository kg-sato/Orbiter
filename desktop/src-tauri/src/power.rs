//! A message-only Win32 window receives lock and suspend events without polling input.
use crate::engine::Backend;
use std::sync::Arc;
#[cfg(windows)]
pub fn listen(backend: Arc<Backend>) {
    use std::sync::OnceLock;
    use windows_sys::Win32::{
        Foundation::*,
        System::{LibraryLoader::GetModuleHandleW, RemoteDesktop::*},
        UI::WindowsAndMessaging::*,
    };
    static BACKEND: OnceLock<Arc<Backend>> = OnceLock::new();
    let _ = BACKEND.set(backend);
    unsafe extern "system" fn proc(hwnd: HWND, msg: u32, w: WPARAM, l: LPARAM) -> LRESULT {
        if (msg == WM_WTSSESSION_CHANGE && w == WTS_SESSION_LOCK as usize)
            || (msg == WM_POWERBROADCAST && w == 4)
        {
            if let Some(b) = BACKEND.get() {
                let _=b.action("power-pause",serde_json::json!({"reason":"Paused while Windows was locked or asleep. Resume when ready."}));
            }
        }
        unsafe { DefWindowProcW(hwnd, msg, w, l) }
    }
    std::thread::spawn(|| unsafe {
        let name: Vec<u16> = "OrbitPowerWindow\0".encode_utf16().collect();
        let instance = GetModuleHandleW(std::ptr::null());
        let class = WNDCLASSW {
            lpfnWndProc: Some(proc),
            hInstance: instance,
            lpszClassName: name.as_ptr(),
            ..std::mem::zeroed()
        };
        RegisterClassW(&class);
        // A hidden top-level window receives power broadcasts as well as WTS messages.
        let hwnd = CreateWindowExW(
            0,
            name.as_ptr(),
            name.as_ptr(),
            0,
            0,
            0,
            0,
            0,
            std::ptr::null_mut(),
            std::ptr::null_mut(),
            instance,
            std::ptr::null(),
        );
        if hwnd.is_null() {
            return;
        }
        WTSRegisterSessionNotification(hwnd, NOTIFY_FOR_THIS_SESSION);
        let mut msg: MSG = std::mem::zeroed();
        while GetMessageW(&mut msg, std::ptr::null_mut(), 0, 0) > 0 {
            TranslateMessage(&msg);
            DispatchMessageW(&msg);
        }
        WTSUnRegisterSessionNotification(hwnd);
    });
}
#[cfg(not(windows))]
pub fn listen(_: Arc<Backend>) {}
