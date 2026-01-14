import requests
from bs4 import BeautifulSoup
import os
import re
import glob
from pathlib import Path
from collections import defaultdict

# Configuration
LOGIN_URL = 'http://ahnbi1.suwon.ac.kr:5151/login'
SUBMIT_URL = 'http://ahnbi1.suwon.ac.kr:5151/submit_test'
USERNAME = '21016082'
PASSWORD = 'asdf0706@@'
SUBMISSIONS_DIR = Path('/Users/jeong-uchang/etf-trading-project/etf-model/submissions')

def get_latest_submission(model_dir: Path, year: int) -> Path:
    """Find latest submission for a given year in the model directory"""
    # Pattern: {year}.{model}.{timestamp}.submission.csv
    # or just containing {year}
    files = list(model_dir.glob(f"{year}*.submission.csv"))
    if not files:
        return None
    
    # Sort by filename (timestamp is usually part of it) or modification time
    # Assuming standard format with timestamp, alphabetical sort works for ISO timestamps
    # Otherwise use modification time
    files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    return files[0]

def submit_and_score(session, file_path: Path, year: str) -> float:
    try:
        with open(file_path, 'rb') as f:
            files_data = {'file': f}
            data = {'year': year}
            
            r = session.post(SUBMIT_URL, data=data, files=files_data)
            
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, 'html.parser')
                text = soup.get_text(strip=True)
                
                # Regex for "점수 = 0.12345"
                score_match = re.search(r'점수\s*=\s*([\d\.]+)', text)
                if score_match:
                    return float(score_match.group(1))
            
            print(f"    Failed to get score for {file_path.name} (Status: {r.status_code})")
            return None
            
    except Exception as e:
        print(f"    Error submitting {file_path.name}: {e}")
        return None

import pandas as pd

def process_models(target_model=None):
    if not SUBMISSIONS_DIR.exists():
        print(f"Directory not found: {SUBMISSIONS_DIR}")
        return

    with requests.Session() as s:
        # 1. Login
        print(f"Logging in as {USERNAME}...")
        payload = {'username': USERNAME, 'password': PASSWORD}
        r = s.post(LOGIN_URL, data=payload)
        if r.status_code != 200:
            print(f"Login failed (Status {r.status_code})")
            return
        print("Login successful.\n")

        # 2. Iterate model directories
        model_dirs = [d for d in SUBMISSIONS_DIR.iterdir() if d.is_dir() and not d.name.startswith('.')]
        model_dirs.sort(key=lambda x: x.name)

        data_records = []

        for model_dir in model_dirs:
            model_name = model_dir.name
            
            # Filter by target model if specified
            if target_model and model_name != target_model:
                continue

            # Skip tabpfn unless explicitly requested
            if not target_model and model_name == 'tabpfn':
                continue

            print(f"Processing Model: {model_name}")
            print("-" * 40)
            
            row = {'Model': model_name}
            scores = []

            for year in range(2020, 2025): # 2020 to 2024
                # Find latest file for this year
                latest_file = get_latest_submission(model_dir, year)
                
                if latest_file:
                    score = submit_and_score(s, latest_file, str(year))
                    if score is not None:
                        scores.append(score)
                        row[str(year)] = score
                        print(f"  {year}: {score:.5f} ({latest_file.name})")
                    else:
                        row[str(year)] = None
                else:
                    print(f"  {year}: Not found")
                    row[str(year)] = None

            if scores:
                avg_score = sum(scores) / len(scores)
                row['Average'] = avg_score
                print(f"  => Average (2020-2024): {avg_score:.5f}")
                data_records.append(row)
            else:
                print("  => No scores")
            print()

        # 3. Summary and CSV
        if data_records:
            df = pd.DataFrame(data_records)
            
            # Reorder columns
            cols = ['Model'] + [str(y) for y in range(2020, 2025)] + ['Average']
            # Ensure all columns exist (even if missing data)
            for c in cols:
                if c not in df.columns:
                    df[c] = None
            df = df[cols]
            
            # Sort by Average desc
            df = df.sort_values('Average', ascending=False)
            
            print("="*40)
            print("FINAL SUMMARY (Average Scores by Model)")
            print("="*40)
            print(df.to_string(index=False, float_format=lambda x: "{:.5f}".format(x) if pd.notnull(x) else "-"))
            
            output_path = 'model_comparison.csv'
            df.to_csv(output_path, index=False)
            print(f"\nSaved results to {output_path}")

import argparse

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Get scores for submissions')
    parser.add_argument('--model', type=str, help='Target specific model directory')
    args = parser.parse_args()
    
    process_models(target_model=args.model)
