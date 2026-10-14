; Uninstallation removes only Orbit's optional startup entry. Study data is retained.
!macro NSIS_HOOK_POSTUNINSTALL
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Orbit Companion"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "Orbiter"
!macroend
