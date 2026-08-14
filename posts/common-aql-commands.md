---
title: Common AQL Commands for Aerospike Management
date: '2019-10-29 21:11:33'
updated: '2019-11-10 18:31:46'
tags: ['aerospike', 'database', 'aql']
slug: common-aql-commands
readTime: 3 min read
cover: https://images.unsplash.com/photo-1544383835-bda2bc66a55d?q=80&w=1000&auto=format&fit=crop
summary: A handy reference guide for Aerospike Query Language (AQL) command-line operations.
---

Aerospike Query Language (`aql`) provides a SQL-like command-line interface for querying and managing Aerospike namespaces, sets, records, and indexes.

Here is a practical cheatsheet of commonly used `aql` commands.

---

## 1. Querying Records in a Namespace Set
```sql
-- Query all records within a set
SELECT * FROM <namespace>.<set>

-- Example:
SELECT * FROM my-storage.my-set WHERE PK = 'user_1024'
```

---

## 2. Inserting and Updating Records
```sql
-- Insert or update record with PK and bin values
INSERT INTO <namespace>.<set> (PK, bin1, bin2) VALUES ('key1', 'value1', 100)
```

---

## 3. Secondary Index Management
```sql
-- Create secondary index on a numeric bin
CREATE INDEX idx_user_age ON my-storage.my-set (age) NUMERIC

-- Create secondary index on a string bin
CREATE INDEX idx_user_email ON my-storage.my-set (email) STRING

-- Drop an index
DROP INDEX my-storage idx_user_age
```

---

## 4. Registering and Running UDFs (User-Defined Functions)
```sql
-- Register Lua module
REGISTER MODULE '/path/to/my_udf.lua'

-- Show registered modules
SHOW MODULES

-- Execute UDF on a record
EXECUTE my_udf.update_score('bonus') ON my-storage.my-set WHERE PK = 'user_1024'
```

---

## 5. System Cluster & Stat Inspection
```sql
-- Show namespaces
SHOW NAMESPACES

-- Show sets
SHOW SETS

-- Show indexes
SHOW INDEXES
```
