from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.bash import BashOperator

# Environment variables to run python tasks within the Docker network
env_vars = {
    'DB_HOST': 'postgres',
    'DB_PORT': '5432',
    'DB_USER': 'postgres',
    'DB_PASSWORD': 'postgres',
    'DB_NAME': 'internjobfinder',
    # Pass search API keys if available in host OS environment
    'GOOGLE_API_KEY': '{{ var.value.get("GOOGLE_API_KEY", "") }}',
    'GOOGLE_CX': '{{ var.value.get("GOOGLE_CX", "") }}',
    'AZURE_STORAGE_CONNECTION_STRING': '{{ var.value.get("AZURE_STORAGE_CONNECTION_STRING", "") }}'
}

default_args = {
    'owner': 'data-engineer',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 2,
    'retry_delay': timedelta(minutes=5),
}

with DAG(
    'intern_job_finder_pipeline',
    default_args=default_args,
    description='Pipeline cào, làm sạch, và đồng bộ dữ liệu tuyển dụng & cuộc thi về PostgreSQL',
    schedule_interval='0 7,19 * * *', # Chạy 2 lần mỗi ngày (7h sáng và 7h tối)
    start_date=datetime(2026, 6, 1),
    catchup=False,
    tags=['scraping', 'etl', 'jobfinder'],
) as dag:

    # Task 1: Khởi tạo database schema
    setup_db_task = BashOperator(
        task_id='setup_database_schema',
        bash_command='python /opt/airflow/scripts/db_setup.py',
        env=env_vars,
    )

    # Task 2: Cào dữ liệu thô (Bronze Layer)
    ingest_raw_data_task = BashOperator(
        task_id='ingest_raw_data',
        bash_command='python /opt/airflow/scripts/ingest.py',
        env=env_vars,
    )

    # Task 3: ETL (Làm sạch, lọc trùng và nạp vào Postgres)
    run_etl_pipeline_task = BashOperator(
        task_id='run_etl_pipeline',
        bash_command='python /opt/airflow/scripts/etl_pipeline.py',
        env=env_vars,
    )

    # Define dependencies
    setup_db_task >> ingest_raw_data_task >> run_etl_pipeline_task
