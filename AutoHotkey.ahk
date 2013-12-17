; CapsLock navigation
Suspend On

h::
^h::
    Send {Left}
    Pressed := true
    Return
+h::
    Send {Shift Down}+{Left}+{Shift Up}
    Pressed := true
    Return


j::
^j::
    Send {Down}
    Pressed := true
    Return
+j::
    Send {Shift Down}+{Down}+{Shift Up}
    Pressed := true
    Return


k::
^k::
    Send {Up}
    Pressed := true
    Return
+k::
    Send {Shift Down}+{Up}+{Shift Up}
    Pressed := true
    Return


l::
^l::
    Send {Right}
    Pressed := true
    Return
+l::
    Send {Shift Down}+{Right}+{Shift Up}
    Pressed := true
    Return


,::
^,::
    Send {Home}
    Pressed := true
    Return
+,::
    Send {Shift Down}+{Home}+{Shift Up}
    Pressed := true
    Return


.::
^.::
    Send {End}
    Pressed := true
    Return
+.::
    Send {Shift Down}+{End}+{Shift Up}
    Pressed := true
    Return


p::
^p::
    Send {PgUp}
    Pressed := true
    Return
+p::
    Send {Shift Down}+{PgUp}+{Shift Up}
    Pressed := true
    Return


n::
^n::
    Send {PgDn}
    Pressed := true
    Return
+n::
    Send {Shift Down}+{PgDn}+{Shift Up}
    Pressed := true
    Return


o::
^o::
    Send {Delete}
    Pressed := true
    Return
+o::
    Send {Shift Down}+{Delete}+{Shift Up}
    Pressed := true
    Return


u::
^u::
    Send {Backspace}
    Pressed := true
    Return
+u::
    Send {Shift Down}+{Backspace}+{Shift Up}
    Pressed := true
    Return


i::
^i::
    Send {Insert}
    Pressed := true
    Return
+i::
    Send {Shift Down}+{Insert}+{Shift Up}
    Pressed := true
    Return


[::
^[::
    Send {Escape}
    Pressed := true
    Return
+[::
    Send {Shift Down}+{Escape}+{Shift Up}
    Pressed := true
    Return


a::
    Pressed := true
    Send {Control Down}
    Return
    
a Up::
    Send {Control Up}
    Return

; toggle layout with left hand only
; f::Send {Alt Down}+{Shift}+{Alt Up}

; toggle CapsLock state
m::
    Pressed := true
    state := GetKeyState("Capslock", "T")
    if state
        SetCapsLockState Off
    else
        SetCapsLockState On
    Return

; Press capslock
CapsLock::
    Suspend Off
    Pressed := false
    Return
!CapsLock::
    Suspend Off
    Pressed := false
    Return
^CapsLock::
    Suspend Off
    Pressed := false
    Return
+CapsLock::
    Suspend Off
    Pressed := false
    Return

; Release capslock
CapsLock Up::
    if not Pressed
        Send {Alt Down}+{Shift}+{Alt Up}
    Suspend On
    Return
!CapsLock Up::
    Send {Alt Up}
    Suspend On
    Return
^CapsLock Up::
    Send {Control Up}
    Suspend On
    Return
+CapsLock Up::
    state := GetKeyState("Capslock", "T")
    if not Pressed
        if state
            SetCapsLockState Off
        else
            SetCapsLockState On
    Send {Shift Up}
    Suspend On
    Return
