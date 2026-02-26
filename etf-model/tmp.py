from src.features.pipeline import FeaturePipeline                                                                                                                                       
                                                                                                                                                                                        
pipeline = FeaturePipeline(include_macro=True)                                                                                                                                         
panel = pipeline.create_panel(                                                                                                                                                          
    tickers=['AAPL', 'MSFT'],                                                                                                                                                           
    start_date='2024-01-01',                                                                                                                                                            
    end_date='2024-06-30',
    shift_features=True
)

print(f"Shape: {panel.shape}")
print(f"MACD 컬럼 확인: {['macd', 'macd_signal', 'macd_hist']}")
print(panel[['ticker', 'date', 'macd', 'macd_signal', 'macd_hist']].tail())