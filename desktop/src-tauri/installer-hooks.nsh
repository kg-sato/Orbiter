; A renamed portable copy shares Orbiter's single-instance identity. Tauri's
; stock installer only checks the target executable path, so it can miss that
; copy and a new launch can silently activate the old UI. Never kill focus here.
!macro NSIS_HOOK_PREINSTALL
  Push $0
  Push $1
  orbiter_wait_for_quit:
    nsExec::ExecToStack /TIMEOUT=15000 '"$SYSDIR\WindowsPowerShell\v1.0\powershell.exe" -NoProfile -NonInteractive -WindowStyle Hidden -Command "if (@(Get-Process -Name orbit-companion* -ErrorAction SilentlyContinue).Count -gt 0) { exit 10 }; exit 0"'
    Pop $0
    Pop $1
    ${If} $0 == 0
      Goto orbiter_ready_to_install
    ${EndIf}
    IfSilent orbiter_install_blocked
    ${If} $0 == 10
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Orbiter is still running, possibly from an older portable copy.$\r$\n$\r$\nSave your work and choose Quit Orbiter from its tray menu, then click Retry. Closing the window with X leaves it running.$\r$\n$\r$\nSetup will not stop your study session automatically." IDRETRY orbiter_wait_for_quit
    ${Else}
      MessageBox MB_RETRYCANCEL|MB_ICONEXCLAMATION "Setup could not check whether Orbiter is running. Close Orbiter from its tray menu and click Retry. If this check keeps failing, cancel setup; no application files have been replaced." IDRETRY orbiter_wait_for_quit
    ${EndIf}
    orbiter_install_blocked:
      Pop $1
      Pop $0
      SetErrorLevel 10
      Quit
    orbiter_ready_to_install:
      Pop $1
      Pop $0
!macroend

; Uninstallation removes only Orbit's optional startup entry. Study data is retained.
!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Orbit Companion"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Orbiter"
!macroend
