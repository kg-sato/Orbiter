#!/bin/bash
# Run on a Mac with full Xcode and an authorized Apple Developer account.
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "TestFlight builds require macOS and Xcode." >&2
  exit 1
fi
: "${TEAM_ID:?Set TEAM_ID to your Apple Developer team ID}"
: "${BUNDLE_ID:?Set BUNDLE_ID to the registered bundle ID of your App Store Connect app}"
if [[ ! "$TEAM_ID" =~ ^[A-Z0-9]{10}$ || ! "$BUNDLE_ID" =~ ^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$ || "$BUNDLE_ID" == "com.example.scheduler" ]]; then
  echo "Use your 10-character team ID and your own registered bundle ID." >&2
  exit 1
fi
python3 scripts/sync_app.py
python3 scripts/check_iphone.py --sdk
BUILD_NUMBER="${BUILD_NUMBER:-$(( $(date -u +%s) / 86400 - 18262 )).$(date -u +%H).$(date -u +%M)}"
auth=(-allowProvisioningUpdates)
# Optional API-key authentication. Otherwise use the account signed into Xcode.
if [[ -n "${ASC_KEY_PATH:-}" ]]; then
  : "${ASC_KEY_ID:?Set ASC_KEY_ID}"
  : "${ASC_ISSUER_ID:?Set ASC_ISSUER_ID}"
  [[ -f "$ASC_KEY_PATH" ]] || { echo "API key file not found." >&2; exit 1; }
  auth+=(-authenticationKeyPath "$ASC_KEY_PATH" -authenticationKeyID "$ASC_KEY_ID" -authenticationKeyIssuerID "$ASC_ISSUER_ID")
fi
mkdir -p build
cat > build/ExportOptions.plist <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>method</key><string>app-store-connect</string>
<key>destination</key><string>upload</string>
<key>signingStyle</key><string>automatic</string>
<key>teamID</key><string>${TEAM_ID}</string>
<key>manageAppVersionAndBuildNumber</key><true/>
<key>uploadSymbols</key><true/>
</dict></plist>
EOF
archive="$PWD/build/Scheduler-${BUILD_NUMBER}.xcarchive"
xcodebuild -project Scheduler.xcodeproj -scheme Scheduler \
  -configuration Release -destination 'generic/platform=iOS' \
  -archivePath "$archive" "${auth[@]}" \
  DEVELOPMENT_TEAM="$TEAM_ID" PRODUCT_BUNDLE_IDENTIFIER="$BUNDLE_ID" \
  CURRENT_PROJECT_VERSION="$BUILD_NUMBER" archive
xcodebuild -exportArchive -archivePath "$archive" \
  -exportOptionsPlist build/ExportOptions.plist -exportPath build/export \
  "${auth[@]}"
echo "Upload command completed. Check App Store Connect for processing status, then enable your TestFlight testers."
