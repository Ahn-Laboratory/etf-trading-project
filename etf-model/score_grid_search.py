"""
Score all grid search submission files

Submits all files in grid_search_* directories and saves results to CSV.
"""
import requests
from bs4 import BeautifulSoup
import re
import time
import json
from pathlib import Path
from datetime import datetime
import pandas as pd

# Configuration
LOGIN_URL = 'http://ahnbi1.suwon.ac.kr:5151/login'
SUBMIT_URL = 'http://ahnbi1.suwon.ac.kr:5151/submit_test'
USERNAME = '21016082'
PASSWORD = 'asdf0706@@'
SUBMISSIONS_DIR = Path('/Users/jeong-uchang/etf-trading-project/etf-model/submissions')
RESULTS_DIR = Path('/Users/jeong-uchang/etf-trading-project/etf-model/results')


def submit_and_score(session, file_path: Path, year: str) -> float:
    """Submit file and get score from server"""
    try:
        with open(file_path, 'rb') as f:
            files_data = {'file': f}
            data = {'year': year}
            
            r = session.post(SUBMIT_URL, data=data, files=files_data)
            
            if r.status_code == 200:
                soup = BeautifulSoup(r.text, 'html.parser')
                text = soup.get_text(strip=True)
                
                score_match = re.search(r'점수\s*=\s*([\d\.]+)', text)
                if score_match:
                    return float(score_match.group(1))
        
        return None
        
    except Exception as e:
        print(f"    Error: {e}")
        return None


def parse_filename(filename: str) -> dict:
    """Parse grid search filename to extract metadata
    
    Format: {year}.{short_name}.{timestamp}.submission.csv
    Example: 2020.xgb_d4_lr0005_n500.20260113_150000.submission.csv
    """
    parts = filename.replace('.submission.csv', '').split('.')
    if len(parts) >= 3:
        year = parts[0]
        short_name = parts[1]
        timestamp = parts[2] if len(parts) > 2 else ''
        
        # Parse short_name for model type and params
        model = 'unknown'
        params = {}
        
        if short_name.startswith('xgb_'):
            model = 'xgboost'
            # xgb_d4_lr0005_n500
            match = re.match(r'xgb_d(\d+)_lr(\d+)_n(\d+)', short_name)
            if match:
                params = {
                    'max_depth': int(match.group(1)),
                    'learning_rate': float('0.' + match.group(2).lstrip('0')) if match.group(2) != '0' else 0.0,
                    'n_estimators': int(match.group(3))
                }
                # Fix learning_rate parsing
                lr_str = match.group(2)
                if lr_str == '01':
                    params['learning_rate'] = 0.01
                elif lr_str == '001':
                    params['learning_rate'] = 0.001
                elif lr_str == '0005':
                    params['learning_rate'] = 0.005
                elif lr_str == '002':
                    params['learning_rate'] = 0.02
                elif lr_str == '005':
                    params['learning_rate'] = 0.005
                elif lr_str == '05':
                    params['learning_rate'] = 0.05
                elif lr_str == '1':
                    params['learning_rate'] = 0.1
                    
        elif short_name.startswith('cb_'):
            model = 'catboost'
            match = re.match(r'cb_d(\d+)_lr(\d+)_n(\d+)', short_name)
            if match:
                lr_str = match.group(2)
                lr = 0.01
                if lr_str == '0005':
                    lr = 0.005
                elif lr_str == '001':
                    lr = 0.01
                elif lr_str == '01':
                    lr = 0.01
                elif lr_str == '002':
                    lr = 0.02
                elif lr_str == '005':
                    lr = 0.005
                elif lr_str == '05':
                    lr = 0.05
                elif lr_str == '1':
                    lr = 0.1
                    
                params = {
                    'depth': int(match.group(1)),
                    'learning_rate': lr,
                    'iterations': int(match.group(3))
                }
                
        elif short_name.startswith('rf_'):
            model = 'random_forest'
            match = re.match(r'rf_d(\d+)_mf(\d+)_n(\d+)', short_name)
            if match:
                mf_str = match.group(2)
                mf = float('0.' + mf_str) if len(mf_str) == 1 else float('0.' + mf_str)
                params = {
                    'max_depth': int(match.group(1)),
                    'max_features': mf,
                    'n_estimators': int(match.group(3))
                }
        
        return {
            'year': year,
            'short_name': short_name,
            'timestamp': timestamp,
            'model': model,
            'params': params
        }
    
    return {'year': '', 'short_name': filename, 'model': 'unknown', 'params': {}}


def score_grid_search_files():
    """Score all grid search submission files"""
    
    # Find all grid search directories
    grid_dirs = [d for d in SUBMISSIONS_DIR.iterdir() 
                 if d.is_dir() and d.name.startswith('grid_search_')]
    
    if not grid_dirs:
        print("No grid_search_* directories found!")
        return
    
    # Collect all submission files
    all_files = []
    for grid_dir in grid_dirs:
        files = list(grid_dir.glob('*.submission.csv'))
        print(f"Found {len(files)} files in {grid_dir.name}")
        all_files.extend(files)
    
    print(f"\nTotal files to score: {len(all_files)}")
    
    if not all_files:
        print("No submission files found!")
        return
    
    # Login and score
    results = []
    
    with requests.Session() as session:
        print(f"\nLogging in as {USERNAME}...")
        payload = {'username': USERNAME, 'password': PASSWORD}
        r = session.post(LOGIN_URL, data=payload)
        
        if r.status_code != 200:
            print(f"Login failed (Status {r.status_code})")
            return
        print("Login successful.\n")
        
        # Process each file
        for i, file_path in enumerate(sorted(all_files)):
            metadata = parse_filename(file_path.name)
            year = metadata['year']
            
            # Get score
            score = submit_and_score(session, file_path, year)
            
            result = {
                'file': file_path.name,
                'directory': file_path.parent.name,
                'year': year,
                'model': metadata['model'],
                'short_name': metadata['short_name'],
                'score': score,
                **metadata['params']
            }
            results.append(result)
            
            # Progress output
            status = f"{score:.5f}" if score else "FAILED"
            print(f"[{i+1}/{len(all_files)}] {metadata['short_name']} ({year}): {status}")
            
            # Brief pause to avoid overwhelming server
            time.sleep(0.3)
            
            # Interim save every 50 files
            if (i + 1) % 50 == 0:
                interim_df = pd.DataFrame(results)
                interim_df.to_csv(RESULTS_DIR / 'grid_search_scores_interim.csv', index=False)
                print(f"  [Interim save: {i+1} files scored]")
    
    # Create DataFrame
    df = pd.DataFrame(results)
    
    # Save raw results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    csv_path = RESULTS_DIR / f'grid_search_scores_{timestamp}.csv'
    df.to_csv(csv_path, index=False)
    print(f"\nResults saved to: {csv_path}")
    
    # Analysis
    print("\n" + "="*70)
    print("GRID SEARCH RESULTS SUMMARY")
    print("="*70)
    
    # Filter successful scores
    scored_df = df[df['score'].notna()]
    
    if scored_df.empty:
        print("No successful scores!")
        return
    
    # Summary by model
    for model in ['xgboost', 'catboost', 'random_forest']:
        model_df = scored_df[scored_df['model'] == model]
        if model_df.empty:
            continue
            
        print(f"\n{model.upper()}:")
        print(f"  Total experiments: {len(model_df)}")
        print(f"  Score range: {model_df['score'].min():.5f} - {model_df['score'].max():.5f}")
        print(f"  Average score: {model_df['score'].mean():.5f}")
        
        # Best configuration
        best = model_df.loc[model_df['score'].idxmax()]
        print(f"  Best: {best['short_name']} ({best['score']:.5f})")
    
    # Overall best
    print("\n" + "="*70)
    print("TOP 10 CONFIGURATIONS")
    print("="*70)
    
    top10 = scored_df.nlargest(10, 'score')
    for i, row in top10.iterrows():
        print(f"{row['model']:<15} {row['short_name']:<30} {row['score']:.5f}")
    
    # Best by year
    print("\n" + "="*70)
    print("BEST BY YEAR")
    print("="*70)
    
    for year in sorted(scored_df['year'].unique()):
        year_df = scored_df[scored_df['year'] == year]
        best = year_df.loc[year_df['score'].idxmax()]
        print(f"{year}: {best['model']:<15} {best['short_name']:<30} {best['score']:.5f}")
    
    # Save summary
    summary = {
        'timestamp': datetime.now().isoformat(),
        'total_files': len(all_files),
        'successful_scores': len(scored_df),
        'models': {}
    }
    
    for model in ['xgboost', 'catboost', 'random_forest']:
        model_df = scored_df[scored_df['model'] == model]
        if not model_df.empty:
            best = model_df.loc[model_df['score'].idxmax()]
            summary['models'][model] = {
                'count': len(model_df),
                'min_score': float(model_df['score'].min()),
                'max_score': float(model_df['score'].max()),
                'avg_score': float(model_df['score'].mean()),
                'best_config': best['short_name'],
                'best_score': float(best['score'])
            }
    
    with open(RESULTS_DIR / f'grid_search_summary_{timestamp}.json', 'w') as f:
        json.dump(summary, f, indent=2)
    
    print(f"\nSummary saved to: {RESULTS_DIR / f'grid_search_summary_{timestamp}.json'}")


if __name__ == "__main__":
    score_grid_search_files()
