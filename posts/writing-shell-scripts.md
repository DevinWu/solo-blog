---
title: Writing Efficient Shell Scripts for Log Analysis
date: '2019-12-01 22:25:09'
updated: '2019-12-01 22:25:09'
tags: ['shell', 'linux', 'automation']
slug: writing-shell-scripts
readTime: 5 min read
cover: https://images.unsplash.com/photo-1629654297299-c8506221ca97?q=80&w=1000&auto=format&fit=crop
summary: A practical guide on writing robust Bash scripts for Kafka consumer log tracking, IP-to-hostname mapping, and cluster metrics automation.
---

In a recent project, our engineering team was troubleshooting Kafka data consumption throughput across multiple nodes. The monitoring dashboard displayed partition consumer IP addresses, whereas server metrics only tracked hostnames. 

To map IPs to hostnames and analyze partition consumption per cluster automatically, I returned to writing Bash shell scripts. 

To engineers unfamiliar with shell scripting, Bash might look like a simple sequence of commands. However, once mastered, it provides unrivaled power for text/file processing and native Linux system automation.

This article reviews several fundamental building blocks required for writing production-grade shell scripts.

---

## 1. Defining a `usage()` Function

A clean `usage()` function documents the script's purpose, describes valid arguments, and provides execution samples:

```bash
function usage() {
    echo "$0 [-a]"
    echo "Usage: "
    echo -e "	 Resolve hostnames for each target IP address"
    echo -e "	 -a Analyze host count and partition allocation per cluster"
    echo -e "	 -h Print help message"
    echo -e "Sample: $0       # Resolves hostnames for all IP addresses"
    echo -e "Sample: $0 -a    # Executes deep cluster host analysis"
}
```

**Key Details:**
1. `$0` evaluates to the script name/path.
2. `echo -e` enables backslash escapes such as tab (`\t`) characters.

---

## 2. Robust Argument Parsing with `getopts`

While standard positional arguments like `$1` work for basic scripts, complex flags are better managed with `getopts` to prevent misalignment:

```bash
while getopts ":ah" opt
do
    case ${opt} in
        a)
            analysis
            ;;
        h)
            usage
            ;;
        ?)
            usage
            ;;
    esac
done
```

**Key Details:**
1. Flags without arguments (like `-a` or `-h`) require no trailing colon. To accept arguments (e.g. `-n Devin`), use `:n:ah`.
2. `?` handles unknown flags.
3. A leading `:` suppresses default error output for missing options.

---

## 3. Advanced String Processing

Since shell primitives treat variables primarily as strings, mastering string transformations is essential.

### 3.1 Extracting Substrings
```bash
function get_last_char() {
    local name="$1"
    echo "${name: -1}"
}
```
`${var:0:5}` extracts 5 characters starting at index 0. `${var:0-15:10}` slices 10 characters starting 15 positions from the right.

### 3.2 String Replacement with `sed`
`sed` streamlines inline pattern substitution:

```bash
echo "https://wudevin.cn." | sed 's/\.$//g'
```
This strips trailing periods (`.`) at the end of input lines (`$`).

### 3.3 Text Delimitation with `awk`
`awk` extracts structured fields from command outputs:

```bash
echo "Wu Devin" | awk -F\  '{print $NF}'
```
`-F\ ` specifies a space separator, while `$NF` prints the final column (`Devin`).

---

## 4. Control Flow

### 4.1 Conditionals
```bash
if [ -z "$var" ]; then
    echo "\$var is empty"
else
    echo "\$var is set to: \$var"
fi
```

### 4.2 Array Iteration Loops
```bash
clusters=("d12" "d13" "d14" "c1" "c2")
for cluster_name in "${clusters[@]}"; do
    if [[ ${cluster_name} == c* ]]; then
        analysis_c_cluster "${cluster_name}"
    else
        analysis_d_cluster "${cluster_name}"
    fi
done
```

---

## 5. File I/O Operations

### 5.1 Writing & Appending
```bash
# Overwrite file
echo "Metrics log entry" > metrics.txt

# Append to file
echo "New event entry" >> metrics.txt
```

### 5.2 Line-by-Line File Iteration
```bash
for host in $(cat host.txt); do
    echo "Processing node: ${host}"
done
```
