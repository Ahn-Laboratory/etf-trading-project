#!/usr/bin/env python3
"""
Quick experiment runner for Mac

Usage:
    # 단일 모델, 단일 연도 테스트 (빠름)
    python run_experiment.py --model ridge --year 2024 --features 50

    # 여러 모델 비교
    python run_experiment.py --model ridge lasso random_forest --year 2024

    # 전체 연도 실험
    python run_experiment.py --model ridge --year 2020 2021 2022 2023 2024
"""
import argparse
import sys
import time
import gc
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent))

from src.models.factory import get_available_models


def run_quick_test():
    """빠른 모델 테스트 (2024년만, 적은 피처)"""
    from src.experiment_pipeline import ExperimentPipeline

    # 테스트할 모델들 (sklearn 기반, 설치 필요 없음)
    models_to_test = ['ridge', 'random_forest']

    print("\n" + "="*60)
    print("QUICK MODEL TEST (Mac)")
    print("="*60)
    print(f"Testing models: {models_to_test}")
    print(f"Year: 2024 only")
    print(f"Features: 50 (reduced for speed)")
    print("="*60)

    # Pre-load data once
    print("\nPre-loading 2024 data for shared use...")
    loader = ExperimentPipeline(model_name=models_to_test[0], max_features=50)
    panel_2024 = loader.load_data_for_year(2024, train_years=3)
    print("Data loaded.\n")

    results = {}

    for model_name in models_to_test:
        print(f"\n>>> Testing {model_name}...")
        start = time.time()

        try:
            pipeline = ExperimentPipeline(
                model_name=model_name,
                max_features=50,
                max_train_samples=10000,
                device='cpu',
                pred_chunk_size=5000
            )

            submission = pipeline.process_year(2024, train_years=3, verbose=True, panel=panel_2024)
            elapsed = time.time() - start

            results[model_name] = {
                'status': 'OK',
                'rows': len(submission),
                'time': elapsed
            }
            print(f"  {model_name}: OK ({len(submission)} rows, {elapsed:.1f}s)")

        except Exception as e:
            elapsed = time.time() - start
            results[model_name] = {
                'status': 'FAILED',
                'error': str(e),
                'time': elapsed
            }
            print(f"  {model_name}: FAILED - {e}")

    # Summary
    print("\n" + "="*60)
    print("RESULTS SUMMARY")
    print("="*60)
    for model, info in results.items():
        status = info['status']
        time_s = info['time']
        if status == 'OK':
            print(f"  {model:<20} {status:<8} {info['rows']:>6} rows  {time_s:>6.1f}s")
        else:
            print(f"  {model:<20} {status:<8} {info.get('error', '')[:40]}")

    return results


def main():
    parser = argparse.ArgumentParser(description='Run ML experiments on Mac')
    parser.add_argument('--model', type=str, nargs='+',
                        default=['ridge'],
                        help='Model(s) to test')
    parser.add_argument('--year', type=int, nargs='+',
                        default=[2024],
                        help='Year(s) to predict')
    parser.add_argument('--features', type=int, default=50,
                        help='Number of features (default: 50 for quick test)')
    parser.add_argument('--samples', type=int, default=10000,
                        help='Max training samples (default: 10000)')
    parser.add_argument('--quick', action='store_true',
                        help='Run quick test with multiple models')
    parser.add_argument('--list', action='store_true',
                        help='List available models')

    args = parser.parse_args()

    if args.list:
        print("\nAvailable models:")
        for m in get_available_models():
            print(f"  - {m}")
        print("\nNote: xgboost, catboost require installation:")
        print("  pip install xgboost catboost")
        return

    if args.quick:
        run_quick_test()
        return

    # Run specified experiments
    from src.experiment_pipeline import ExperimentPipeline

    # Use first model as loader
    loader = ExperimentPipeline(
        model_name=args.model[0],
        max_features=args.features,
        max_train_samples=args.samples,
        device='cpu'
    )

    all_paths = {}

    for year in args.year:
        print(f"\n{'='*60}")
        print(f"Processing Year: {year}")
        print(f"{'='*60}")

        # 1. Load data for this year
        try:
            panel = loader.load_data_for_year(year, train_years=5)
        except Exception as e:
            print(f"Error loading data for {year}: {e}")
            continue

        # 2. Run all models on this data
        for model_name in args.model:
            print(f"\n>>> Running {model_name} for {year}")
            
            try:
                pipeline = ExperimentPipeline(
                    model_name=model_name,
                    max_features=args.features,
                    max_train_samples=args.samples,
                    device='cpu'
                )

                paths = pipeline.run(
                    pred_years=[year],
                    train_years=5,
                    verbose=True,
                    panels={year: panel}
                )
                
                # Collect results
                if model_name not in all_paths:
                    all_paths[model_name] = {}
                all_paths[model_name].update(paths)

            except Exception as e:
                print(f"Error with {model_name} on {year}: {e}")
                import traceback
                traceback.print_exc()

        # 3. Clean up
        del panel
        gc.collect()

    print(f"\n{'='*60}")
    print("All Experiments Completed")
    print(f"{'='*60}")
    
    for model_name, paths in all_paths.items():
        print(f"\nSubmission files for {model_name}:")
        for year, path in sorted(paths.items()):
            print(f"  {year}: {path}")


if __name__ == "__main__":
    main()
