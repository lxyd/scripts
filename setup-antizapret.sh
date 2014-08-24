#!/usr/bin/env bash

ADDRESS_LIST_URL="https://github.com/zapret-info/z-i/raw/master/dump.csv"

SQUID_LOGIN=user
SQUID_PASSWORD=
SQUID_PORT=3128
SERVER_ADDRESS="$(echo $(hostname --ip-address))" # echo is for trimming
SQUID_REALM="Proxy$RANDOM"

# path to additional configuration file
# it can contain:
# |  #comments
# |  /^regular.expressions$/ to match host or url
# |  or.exact.hostnam.es     to match host, url or ip
PROXY_HOSTS_LIST_FILE="/etc/proxy_hosts"

function print_lines() {
    local A
    for A in "$@"; do
        printf "%s\n" "$A"
    done
}

function print_errors() {
    print_lines "$@" >&2
}

function die() {
    print_errors "$@"
    exit 1
}

function backup_file() {
    local FN="$1"
    while [[ "$FN" =~ /$ ]]; do
        FN="${FN%/}"
    done
    local BAKFN="$FN.bak"
    [[ -e "$FN" ]] || return 1
    if [[ -e "$BAKFN" ]]; then
        backup_file "$BAKFN" && rm -r "$BAKFN" || return 2
    fi
    cp -r "$FN" "$BAKFN" || return 3
}

function is_number() {
    [[ "$1" =~ ^[0-9]+$ ]] && return 0 || return 1
}

function read_password() {
    local MSG="$1"

    [[ -n "$MSG" ]] || MSG="Enter password"

    local PASSWORD_ENTERED=
    local PASSWORD_REENTERED=

    echo -n "$MSG: " > /dev/tty
    IFS=$"\n" read -s -r PASSWORD_ENTERED < /dev/tty
    echo > /dev/tty
    if [[ -z "$PASSWORD_ENTERED" ]]; then
        print_lines "ERROR: Password is empty" > /dev/tty
        return 1
    fi
    echo -n "Re-enter password: " > /dev/tty
    IFS=$"\n" read -s -r PASSWORD_REENTERED < /dev/tty
    echo > /dev/tty
    if [[ "$PASSWORD_ENTERED" != "$PASSWORD_REENTERED" ]]; then
        print_lines "ERROR: Passwords do not match" > /dev/tty
        return 2
    fi
    echo "$PASSWORD_ENTERED"
}

# rough analogue of the htdigest utility
function htdigest_analogue() {
    local FILE="$1"
    local REALM="$2"
    local USER="$3"
    local PASSWORD="$4"

    local PREFIX="$USER:$REALM:"

    [[ -n "$FILE" ]] && [[ -n "$REALM" ]] && [[ -n "$USER" ]] && [[ -n "$PASSWORD" ]] || return 1
    [[ -e "$FILE" ]] || touch "$FILE" || return 2

    local DIGEST=$(printf "%s" "$PREFIX$PASSWORD" | md5sum | cut -d ' ' -f 1)

    local TMP="$(mktemp)"

    grep -v "$PREFIX" "$FILE" > "$TMP"

    echo "$PREFIX$DIGEST" >> "$TMP"

    cat "$TMP" > "$FILE"

    rm "$TMP"
}

function print_help() {
    print_lines "USAGE: $0 [options]" \
                "Available options are:" \
                "  -h|--help                    - show this help message and exit" \
                "  -a|--address SERVER_ADDRESS  - set server address " \
                "                                 (default is $SERVER_ADDRESS)" \
                "  -p|--port SQUID_PORT         - change proxy port " \
                "                                 (default is $SQUID_PORT)" \
                "  -R|--realm SQUID_REALM       - change squid auth realm" \
                "                                 (default is $SQUID_REALM)" \
                "  -L|--login SQUID_LOGIN       - change proxy login" \
                "                                 (default is '$SQUID_LOGIN')" \
                "  -P|--password SQUID_PASSWORD - provide proxy password" \
                "                                 (will be asked for if ommited)"
}

while (( $# > 0 )); do
    case "$1" in 
        -h|--help)
            print_help
            exit 0
            ;;
        -a|--address)
            shift
            SERVER_ADDRESS="$1"
            [[ -n "$SERVER_ADDRESS" ]] || die "Server address is empty"
            ;;
        -p|--port)
            shift
            SQUID_PORT="$1"
            is_number "$SQUID_PORT" && (( SQUID_PORT > 0 )) && (( SQUID_PORT < 65536 )) || die "Invalid port: $SQUID_PORT"
            ;;
        -R|--realm)
            shift
            SQUID_REALM="$1"
            [[ -n "$SQUID_REALM" ]] || die "Realm is empty"
            ;;
        -L|--login)
            shift
            SQUID_LOGIN="$1"
            [[ -n "$SQUID_LOGIN" ]] || die "Login is empty"
            ;;
        -P|--password)
            shift
            SQUID_PASSWORD="$1"
            [[ -n "$SQUID_PASSWORD" ]] || die "Password is empty"
            ;;
        *)
            die "Invalid argument: '$1'"
            ;;
    esac
    shift
done

while [[ -z "$SQUID_PASSWORD" ]]; do
    SQUID_PASSWORD="$(read_password "Enter desired proxy password")"
done

echo "Updating package list"
apt-get update -y || die "Couldn't update package list"
echo "Installing proxy and http servers"
apt-get install -y squid lighttpd wget || die "Couldn't install required packages"

#
# 1. setup squid proxy server
#

SQUID_CFG_DIR="/etc/squid"
SQUID_CFG_PASSWD_FILE="$SQUID_CFG_DIR/passwd"
SQUID_CFG_FILE="$SQUID_CFG_DIR/squid.conf"

touch "$SQUID_CFG_PASSWD_FILE"
chown proxy:proxy "$SQUID_CFG_PASSWD_FILE"
chmod 640 "$SQUID_CFG_PASSWD_FILE"

htdigest_analogue "$SQUID_CFG_PASSWD_FILE" "$SQUID_REALM" "$SQUID_LOGIN" "$SQUID_PASSWORD"

backup_file "$SQUID_CFG_FILE"
# based on http://blog.mafr.de/2013/06/16/setting-up-a-web-proxy-with-squid/
cat > "$SQUID_CFG_FILE" <<EOF
auth_param digest program /usr/lib/squid/digest_pw_auth -c $SQUID_CFG_PASSWD_FILE
auth_param digest realm $SQUID_REALM
auth_param digest children 2

acl all src all
acl auth_users proxy_auth REQUIRED
acl to_localhost dst 127.0.0.0/8 0.0.0.0/32
acl SSL_ports port 443
acl SSL_ports port 563
acl SSL_ports port 873
acl CONNECT method CONNECT

http_access deny CONNECT !SSL_ports
http_access deny to_localhost
http_access allow auth_users
http_access deny all

http_port $SQUID_PORT

access_log none
EOF

update-rc.d squid enable
service squid reload

#
# 2. setup lighttpd to serve our proxy.pac
#

WEB_DIR="/var/www"
PAC_FILE="$WEB_DIR/proxy.pac"

LIGHTTPD_CFG_FILE="/etc/lighttpd/lighttpd.conf"
backup_file "$LIGHTTPD_CFG_FILE"
cat > "$LIGHTTPD_CFG_FILE" <<EOF
server.modules = (
    "mod_access"
)
server.document-root = "$WEB_DIR"
server.username = "www-data"
server.groupname = "www-data"
server.port = 80

url.access-deny = ("~", ".inc")
EOF

update-rc.d lighttpd enable
service lighttpd reload

#
# 3. create a script that generates proxy.pac with up-to-date data
#

SCRIPT_FILE="/etc/cron.daily/gen_proxy_pac"
cat > "$SCRIPT_FILE" <<EOF
#!/usr/bin/env bash
PAC_FILE="$PAC_FILE"
ADDRESS_LIST_URL="$ADDRESS_LIST_URL"
PROXY_URL="$SERVER_ADDRESS:$SQUID_PORT"
PROXY_HOSTS_LIST_FILE="$PROXY_HOSTS_LIST_FILE"
EOF
# and the rest of the script we generate without $substitutions
cat >> "$SCRIPT_FILE" <<"EOF"
LIST_FILE="$(mktemp)"

function clean_up() {
    rm "$LIST_FILE"
}

function quit() {
    clean_up
    [[ -n "$2" ]] && printf "%s\n" "$2"
    exit $1
}

trap clean_up SIGHUP SIGINT SIGTERM

wget "$ADDRESS_LIST_URL" --output-document - > "$LIST_FILE" || quit 1 "Error downloading list"

cat > "$PAC_FILE" <<E_O_F
// PAC-ip File (similar to ProstoVPN.AntiZapret's one)
// Generated on $(date)

// subject to match url or host
var regexps = [
E_O_F

grep '^/' "$PROXY_HOSTS_LIST_FILE" | sed 's/^\(.*\)$/    \1,/' >> "$PAC_FILE"

cat >> "$PAC_FILE" << E_O_F
];

// subject to exactly match url, host or ip
var hosts = [
E_O_F

grep -v '^#\|^$\|^/' "$PROXY_HOSTS_LIST_FILE" | sort | sed 's/^\(.*\)$/    "\1",/' >> "$PAC_FILE"

cat >> "$PAC_FILE" << E_O_F
];

// subject to exactly match ip
var ips = [
E_O_F

# skip first line, than extract first field from each
# than handle "ip1 | ip2" constructs
tail -n +2 "$LIST_FILE" | cut -d ';' -f 1 | tr '|' $"\n" | tr -d ' ' | sort | uniq | sed 's/^\(.*\)$/    "\1",/' >> "$PAC_FILE"

cat >> "$PAC_FILE" <<E_O_F
];

function diho_search(arr, val) {
    var a = 0, b = arr.length - 1;
    while (b > a) {
        var i = Math.floor((b+a) / 2);
        if (arr[i] < val) {
            a = i+1;
        } else {
            b = i;
        }
    }
    return arr[a] == val ? a : -1;
}

var result_proxy = "PROXY $PROXY_URL; DIRECT"
  , result_direct = "DIRECT";

function FindProxyForURL(url, host) {
    if (diho_search(hosts, host) >= 0 || diho_search(hosts, url) >= 0) {
        return result_proxy;
    }

    for (var i = 0; i < regexps.length; i++) {
        if (regexps[i].test(host) || regexps[i].test(url)) {
            return result_proxy;
        }
    }

    var ip = dnsResolve(host);

    if (diho_search(hosts, ip) >= 0) {
        return result_proxy;
    }

    if (diho_search(ips, ip) >= 0) {
        return result_proxy;
    }

    return result_direct;
}
E_O_F

quit 0

EOF

chmod a+x "$SCRIPT_FILE"

update-rc.d cron enable
service cron reload

# run script to generate pac right now
"$SCRIPT_FILE"

print_lines "Proxy is ready. Setup your browser to use this auto-configuration address:" \
            "http://$SERVER_ADDRESS/proxy.pac"

