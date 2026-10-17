"""Read memory for the disposable review browser's exact process IDs only."""
import ctypes,json,sys
from ctypes import wintypes
class Counters(ctypes.Structure):
    _fields_=[('cb',wintypes.DWORD),('faults',wintypes.DWORD)]+[(n,ctypes.c_size_t) for n in ['peakWorking','working','peakPaged','paged','peakNonpaged','nonpaged','pagefile','peakPagefile','private']]
k=ctypes.WinDLL('kernel32',use_last_error=True)
k.OpenProcess.argtypes=[wintypes.DWORD,wintypes.BOOL,wintypes.DWORD]
k.OpenProcess.restype=wintypes.HANDLE
k.CloseHandle.argtypes=[wintypes.HANDLE]
p=ctypes.WinDLL('psapi');p.GetProcessMemoryInfo.argtypes=[wintypes.HANDLE,ctypes.POINTER(Counters),wintypes.DWORD]
result={'workingBytes':0,'privateBytes':0,'readProcesses':0}
for pid in sys.argv[1:]:
    handle=k.OpenProcess(0x410,False,int(pid))
    if not handle:continue
    c=Counters();c.cb=ctypes.sizeof(c)
    if p.GetProcessMemoryInfo(handle,ctypes.byref(c),c.cb):
        result['workingBytes']+=c.working;result['privateBytes']+=c.private;result['readProcesses']+=1
    k.CloseHandle(handle)
print(json.dumps(result))
