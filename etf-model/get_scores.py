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

def get_score():
    with requests.Session() as s:
        # 1. Login
        print(f"Logging in as {USERNAME}...")
        payload = {'username': USERNAME, 'password': PASSWORD}
        r = s.post(LOGIN_URL, data=payload)
        if r.status_code != 200:
            print(f"Login failed (Status {r.status_code})")
            return

        # 2. Find submission files
        files = glob.glob(os.path.join(SUBMISSIONS_DIR, '*.submission.csv'))
        # Filter only simple pattern like 'YYYY.submission.csv' or try to extract year
        # Priority: parse year from filename content
        
        # Sort files to process
        files.sort()
        
        scores = []
        
        print(f"\nFound {len(files)} submission files. processing...")
        
        for file_path in files:
            filename = os.path.basename(file_path)
            
            # Reset extraction logic: match year at start
            match = re.match(r'(\d{4})', filename)
            if not match:
                continue
                
            year = match.group(1)
            
            # Skip if year is not in expected range (optimization)
            if year not in ['2020', '2021', '2022', '2023', '2024']:
                continue

            try:
                with open(file_path, 'rb') as f:
                    files_data = {'file': f}
                    data = {'year': year}
                    
                    r = s.post(SUBMIT_URL, data=data, files=files_data)
                    
                    if r.status_code == 200:
                        # Extract score
                        # Pattern: [테스트 제출] 2024 점수 = 0.16794
                        soup = BeautifulSoup(r.text, 'html.parser')
                        text = soup.get_text(strip=True)
                        
                        score_match = re.search(r'점수\s*=\s*([\d\.]+)', text)
                        if score_match:
                            score = float(score_match.group(1))
                            scores.append(score)
                            print(f"[{year}] File: {filename} -> Score: {score}")
                        else:
                            print(f"[{year}] File: {filename} -> Score not found in response")
                    else:
                        print(f"[{year}] File: {filename} -> Upload failed {r.status_code}")
                        
            except Exception as e:
                print(f"[{year}] Error processing {filename}: {e}")

    if scores:
        avg_score = sum(scores) / len(scores)
        print("\n" + "="*40)
        print(f"Summary:")
        print(f"Total Submissions: {len(scores)}")
        print(f"Average Score: {avg_score:.5f}")
        print("="*40)
    else:
        print("\nNo scores retrieved.")

if __name__ == "__main__":
    get_score()
