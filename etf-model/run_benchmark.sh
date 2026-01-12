#!/bin/bash
# Run full benchmark and get average score

# 1. Run experiment (adjust parameters as needed)
# optimizing for speed with fewer features for demonstration
echo "Starting experiment..."
python run_experiment.py --model ridge --year 2020 2021 2022 2023 2024 --features 100

# 2. Get scores and average
echo "Getting scores..."
python get_scores.py
