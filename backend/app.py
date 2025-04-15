# app.py

from flask import Flask, jsonify
from flask_cors import CORS
from optimizer_etabs import run_etabs_optimizer

app = Flask(__name__)
CORS(app)

@app.route("/optimize", methods=["GET"])
def optimize():
    try:
        result = run_etabs_optimizer()
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)})

if __name__ == "__main__":
    app.run(debug=True, port=5000)
