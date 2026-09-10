# app/services/prediction_service.py
# Feature 06 — Environmental Progress & Future Prediction (/predict-trend)
# Linear regression over the city's historical daily health scores with pure Python fallback.

def predict(historical_data: list) -> dict:
    """
    historical_data: list of Pydantic HistoricalPoint objects
                      (each has .date and .healthScore)
    Returns: { predictedScore, trend }
    """
    if len(historical_data) < 2:
        last_score = historical_data[-1].healthScore if historical_data else 50
        return {"predictedScore": round(float(last_score), 1), "trend": "stable"}

    y_vals = [float(point.healthScore) for point in historical_data]
    x_vals = list(range(len(y_vals)))

    # Try scikit-learn LinearRegression first
    try:
        import numpy as np
        from sklearn.linear_model import LinearRegression
        
        X = np.array(x_vals).reshape(-1, 1)
        y = np.array(y_vals)
        model = LinearRegression()
        model.fit(X, y)
        
        predicted_score = float(model.predict(np.array([[len(y_vals)]]))[0])
        slope = float(model.coef_[0])
    except Exception:
        # Pure Python least-squares regression fallback
        n = len(x_vals)
        mean_x = sum(x_vals) / n
        mean_y = sum(y_vals) / n
        
        numerator = sum((x_vals[i] - mean_x) * (y_vals[i] - mean_y) for i in range(n))
        denominator = sum((x_vals[i] - mean_x) ** 2 for i in range(n)) or 1
        
        slope = numerator / denominator
        intercept = mean_y - slope * mean_x
        predicted_score = slope * len(y_vals) + intercept

    predicted_score = round(max(0.0, min(100.0, float(predicted_score))), 1)

    if slope > 0.5:
        trend = "improving"
    elif slope < -0.5:
        trend = "declining"
    else:
        trend = "stable"

    return {"predictedScore": predicted_score, "trend": trend}