
import requests
from bs4 import BeautifulSoup
import os
import re
import glob

# Configuration
LOGIN_URL = 'http://ahnbi1.suwon.ac.kr:5151/login'
SUBMIT_URL = 'http://ahnbi1.suwon.ac.kr:5151/submit_test'
USERNAME = '21016082'
PASSWORD = 'asdf0706@@'
SUBMISSIONS_DIR = '/Users/jeong-uchang/etf-trading-project/etf-model/submissions'

def get_latest_scores():
    # 1. Group files by (Year, Model) and find the latest one
    # Search recursively in subdirectories
    files = glob.glob(os.path.join(SUBMISSIONS_DIR, '**', '*.submission.csv'), recursive=True)
    latest_files = {} # Key: (year, model), Value: (timestamp, filepath)
    
    # Pattern to match: YYYY.model.TIMESTAMP.submission.csv
    # Example: 2020.lasso.20260112_213002.submission.csv
    pattern = re.compile(r'(\d{4})\.(.+)\.(\d{8}_\d{6})\.submission\.csv')
    
    print(" scanning files...")
    for f in files:
        filename = os.path.basename(f)
        match = pattern.match(filename)
        if match:
            year, model, timestamp = match.groups()
            key = (year, model)
            if key not in latest_files or timestamp > latest_files[key][0]:
                latest_files[key] = (timestamp, f)
    
    # Sort by year then model
    sorted_keys = sorted(latest_files.keys())
    
    if not sorted_keys:
        print("No matching submission files found.")
        return

    print(f"Found {len(sorted_keys)} latest submission files.")

    # 2. Login and Submit
    with requests.Session() as s:
        # Login
        print(f"Logging in as {USERNAME}...")
        payload = {'username': USERNAME, 'password': PASSWORD}
        r = s.post(LOGIN_URL, data=payload)
        if r.status_code != 200:
            print(f"Login failed (Status {r.status_code})")
            return

        print("\n" + "="*80)
        print(f"{'Year':<6} | {'Model':<20} | {'Score':<10} | {'File'}")
        print("-" * 80)
        
        scores_by_year = {}
        scores_by_model = {}
        all_scores = []
        results_data = [] # List of dicts for CSV

        for year, model in sorted_keys:
            timestamp, file_path = latest_files[(year, model)]
            filename = os.path.basename(file_path)
            
            try:
                with open(file_path, 'rb') as f:
                    files_data = {'file': f}
                    data = {'year': year}
                    
                    r = s.post(SUBMIT_URL, data=data, files=files_data)
                    
                    if r.status_code == 200:
                        soup = BeautifulSoup(r.text, 'html.parser')
                        text = soup.get_text(strip=True)
                        score_match = re.search(r'점수\s*=\s*([\d\.]+)', text)
                        
                        if score_match:
                            score = float(score_match.group(1))
                            print(f"{year:<6} | {model:<20} | {score:<10.5f} | {filename}")
                            
                            # Aggregate by Year
                            if year not in scores_by_year:
                                scores_by_year[year] = []
                            scores_by_year[year].append(score)

                            # Aggregate by Model
                            if model not in scores_by_model:
                                scores_by_model[model] = []
                            scores_by_model[model].append(score)
                            
                            # Aggregate All
                            all_scores.append(score)
                            
                            # Add to results
                            results_data.append({
                                'Year': year,
                                'Model': model,
                                'Score': score,
                                'File': filename,
                                'Timestamp': timestamp
                            })
                        else:
                            print(f"{year:<6} | {model:<20} | {'ERROR':<10} | {filename} (Score not found)")
                    else:
                        print(f"{year:<6} | {model:<20} | {'FAIL':<10} | {filename} (HTTP {r.status_code})")
                        
            except Exception as e:
                print(f"{year:<6} | {model:<20} | {'EXCEPT':<10} | {filename} ({e})")

        print("="*80)
        
        # Calculate Averages
        print("\n" + "="*40)
        print(" PERFORMANCE STATISTICS")
        print("="*40)

        # 1. By Year
        print("\n--- Average by Year ---")
        for year in sorted(scores_by_year.keys()):
            scores = scores_by_year[year]
            if scores:
                avg = sum(scores) / len(scores)
                print(f"Year {year:<4}: {avg:.5f} ({len(scores)} models)")

        # 2. By Model
        print("\n--- Average by Model ---")
        for model in sorted(scores_by_model.keys()):
            scores = scores_by_model[model]
            if scores:
                avg = sum(scores) / len(scores)
                print(f"Model {model:<15}: {avg:.5f} ({len(scores)} years)")

        # 3. Overall
        print("\n--- Overall ---")
        if all_scores:
            grand_avg = sum(all_scores) / len(all_scores)
            print(f"Grand Average     : {grand_avg:.5f} ({len(all_scores)} submissions)")
            print(f"Highest Score     : {max(all_scores):.5f}")
            print(f"Lowest Score      : {min(all_scores):.5f}")
        print("="*40)

        # Save to CSV
        import csv
        csv_filename = 'benchmark_results.csv'
        print(f"\nSaving results to {csv_filename}...")
        
        if results_data:
            keys = ['Year', 'Model', 'Score', 'Timestamp', 'File']
            with open(csv_filename, 'w', newline='') as output_file:
                dict_writer = csv.DictWriter(output_file, fieldnames=keys)
                dict_writer.writeheader()
                dict_writer.writerows(results_data)
            print(f"Done. {len(results_data)} rows written.")
        else:
            print("No data to save.")

if __name__ == "__main__":
    get_latest_scores()
