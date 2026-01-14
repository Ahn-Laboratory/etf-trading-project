
import os
import shutil
import glob

SUBMISSIONS_DIR = 'submissions'

# Known models to be safe, but can also be dynamic
KNOWN_MODELS = {
    'ridge', 'lasso', 'random_forest', 'extra_trees', 'elasticnet', 'svr', 
    'xgboost', 'catboost', 'tabpfn', 'tabpfn_v2'
}

def organize():
    files = glob.glob(os.path.join(SUBMISSIONS_DIR, '*'))
    
    count = 0
    for file_path in files:
        if not os.path.isfile(file_path):
            continue
            
        filename = os.path.basename(file_path)
        parts = filename.split('.')
        
        target_model = None
        
        # Heuristics
        if len(parts) >= 3:
            potential_model = parts[1]
            if potential_model in KNOWN_MODELS:
                target_model = potential_model
            elif potential_model == 'submission':
                # e.g. 2020.submission.csv -> maybe 'baseline' or leave it
                target_model = 'legacy' 
        
        if target_model:
            target_dir = os.path.join(SUBMISSIONS_DIR, target_model)
            if not os.path.exists(target_dir):
                os.makedirs(target_dir)
            
            new_path = os.path.join(target_dir, filename)
            shutil.move(file_path, new_path)
            print(f"Moved {filename} -> {target_model}/")
            count += 1
            
    print(f"Organized {count} files.")

if __name__ == "__main__":
    organize()
