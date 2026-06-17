-- Create database for Apache Airflow metadata
SELECT 'CREATE DATABASE airflow'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'airflow')\gexec

-- Create database for the application's Data Warehouse
SELECT 'CREATE DATABASE internjobfinder'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'internjobfinder')\gexec
