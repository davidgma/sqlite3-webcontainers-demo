#!/bin/sh
node cli.mjs "CREATE TABLE IF NOT EXISTS demo (id INT, item TEXT); INSERT INTO demo VALUES (1, 'StackBlitz'); SELECT * FROM demo;"