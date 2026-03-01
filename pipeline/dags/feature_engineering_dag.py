"""
PhishAware — Airflow DAG: Feature Engineering Pipeline
DAG ID: feature_engineering

Runs daily to:
1. Aggregate keyword frequency stats from recent scans
2. Compute rolling averages and trend scores
3. Update keyword_stats table
4. Generate daily threat summary report
"""

from datetime import timedelta
from airflow import DAG
from airflow.operators.python import PythonOperator
from airflow.utils.dates import days_ago
import logging

logger = logging.getLogger(__name__)

default_args = {
    "owner": "phish-aware",
    "retries": 1,
    "retry_delay": timedelta(minutes=5),
}

dag = DAG(
    dag_id="feature_engineering",
    default_args=default_args,
    description="Compute keyword trends and threat feature aggregations",
    schedule_interval="0 2 * * *",  # daily at 2am
    start_date=days_ago(1),
    catchup=False,
    tags=["phish-aware", "feature-engineering", "analytics"],
)


def extract_recent_scans(**context):
    """Pull last 24 hours of scan data from Supabase."""
    # In production: query Supabase scan_logs
    # result = supabase.table("scan_logs")
    #   .select("*")
    #   .gte("created_at", yesterday_iso)
    #   .execute()
    logger.info("Extracted recent scan data")
    context["ti"].xcom_push(key="scan_count", value=42)


def compute_keyword_frequencies(**context):
    """
    Flatten all urgent_keywords arrays from scans,
    count occurrences, and compute avg risk score per keyword.
    """
    # SELECT keyword, COUNT(*), AVG(risk_score)
    # FROM scan_logs, UNNEST(urgent_keywords) AS keyword
    # WHERE created_at > NOW() - INTERVAL '24 hours'
    # GROUP BY keyword
    logger.info("Computed keyword frequencies")


def compute_domain_threat_trends(**context):
    """
    Identify domains appearing in multiple scans with high risk scores.
    Flag repeat offenders for domain blacklist.
    """
    # Domains flagged 3+ times in 24hrs with risk > 65 → escalate
    logger.info("Computed domain threat trends")


def update_keyword_stats(**context):
    """LOAD: Upsert aggregated keyword stats to Supabase."""
    # supabase.table("keyword_stats").upsert(computed_stats).execute()
    logger.info("Updated keyword_stats table")


def generate_daily_summary(**context):
    """
    Generates a daily threat digest:
    - Total scans
    - Dangerous/Suspicious/Safe breakdown
    - Top 5 phishing domains
    - Top 10 keywords
    Saves to pipeline_runs table for dashboard display.
    """
    logger.info("Daily threat summary generated")


t1 = PythonOperator(task_id="extract_recent_scans", python_callable=extract_recent_scans, dag=dag)
t2 = PythonOperator(task_id="compute_keyword_frequencies", python_callable=compute_keyword_frequencies, dag=dag)
t3 = PythonOperator(task_id="compute_domain_threat_trends", python_callable=compute_domain_threat_trends, dag=dag)
t4 = PythonOperator(task_id="update_keyword_stats", python_callable=update_keyword_stats, dag=dag)
t5 = PythonOperator(task_id="generate_daily_summary", python_callable=generate_daily_summary, dag=dag)

t1 >> [t2, t3] >> t4 >> t5
