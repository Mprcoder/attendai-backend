from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from routes.attendance_routes import attendance_bp
from routes.webhook_routes import webhook_bp


def create_app() -> Flask:
    """
    Application factory for the AttendAI (Virtual Coordinator AI) Flask Backend.
    """
    app = Flask(__name__)
    app.config["SECRET_KEY"] = Config.SECRET_KEY

    # Enable CORS for frontend dashboard integration
    CORS(app, resources={r"/*": {"origins": "*"}})

    # Register modular route blueprints
    app.register_blueprint(attendance_bp)
    app.register_blueprint(webhook_bp)

    @app.route("/health", methods=["GET"])
    def health_check():
        return (
            jsonify(
                {
                    "status": "healthy",
                    "service": "AttendAI Virtual Coordinator Backend",
                    "supabase_configured": bool(
                        Config.SUPABASE_URL and Config.SUPABASE_KEY
                    ),
                    "elevenlabs_configured": bool(
                        Config.ELEVENLABS_API_KEY and Config.ELEVENLABS_AGENT_ID
                    ),
                }
            ),
            200,
        )

    # Global Error Handlers
    @app.errorhandler(404)
    def handle_not_found(err):
        return jsonify({"error": "Endpoint not found."}), 404

    @app.errorhandler(405)
    def handle_method_not_allowed(err):
        return jsonify({"error": "HTTP method not allowed for this endpoint."}), 405

    @app.errorhandler(500)
    def handle_internal_error(err):
        return jsonify({"error": "Internal server error."}), 500

    return app


app = create_app()

if __name__ == "__main__":
    app.run(
        host="0.0.0.0",
        port=Config.PORT,
        debug=(Config.FLASK_ENV == "development"),
    )
