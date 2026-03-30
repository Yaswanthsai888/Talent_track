import os
import logging
import json
import traceback
from logging.handlers import RotatingFileHandler

def setup_logging(service_name):
    """
    Configure comprehensive logging for Python microservices
    
    Args:
        service_name (str): Name of the microservice
    
    Returns:
        logging.Logger: Configured logger instance
    """
    # Create logs directory if not exists
    log_dir = os.path.join(os.path.dirname(__file__), '..', 'logs')
    os.makedirs(log_dir, exist_ok=True)

    # Logger configuration
    logger = logging.getLogger(service_name)
    logger.setLevel(logging.INFO)

    # Prevent duplicate log handlers
    if not logger.handlers:
        # Console Handler
        console_handler = logging.StreamHandler()
        console_handler.setLevel(logging.INFO)

        # File Handler with Rotation
        file_handler = RotatingFileHandler(
            filename=os.path.join(log_dir, f'{service_name}.log'),
            maxBytes=50 * 1024 * 1024,  # 50 MB
            backupCount=5
        )
        file_handler.setLevel(logging.INFO)

        # Error File Handler
        error_handler = RotatingFileHandler(
            filename=os.path.join(log_dir, f'{service_name}_error.log'),
            maxBytes=20 * 1024 * 1024,  # 20 MB
            backupCount=3
        )
        error_handler.setLevel(logging.ERROR)

        # JSON Formatter
        class JsonFormatter(logging.Formatter):
            def format(self, record):
                log_record = {
                    'timestamp': self.formatTime(record),
                    'level': record.levelname,
                    'service': service_name,
                    'message': record.getMessage(),
                    'module': record.module,
                    'line': record.lineno
                }
                
                if record.exc_info:
                    log_record['exception'] = traceback.format_exception(*record.exc_info)
                
                return json.dumps(log_record)

        json_formatter = JsonFormatter()
        console_handler.setFormatter(json_formatter)
        file_handler.setFormatter(json_formatter)
        error_handler.setFormatter(json_formatter)

        # Add handlers to logger
        logger.addHandler(console_handler)
        logger.addHandler(file_handler)
        logger.addHandler(error_handler)

    return logger

# Example usage in microservices
def log_service_start(logger, port):
    """Log microservice startup"""
    logger.info(f"Service started successfully", extra={
        "event": "service_start",
        "port": port
    })

def log_request(logger, method, endpoint, status_code):
    """Log incoming requests"""
    logger.info(f"Request processed", extra={
        "event": "request_processed",
        "method": method,
        "endpoint": endpoint,
        "status_code": status_code
    })

def log_error(logger, error, context=None):
    """Log errors with optional context"""
    error_details = {
        "event": "error_occurred",
        "error_type": type(error).__name__,
        "error_message": str(error)
    }
    if context:
        error_details["context"] = context
    
    logger.error(str(error), extra=error_details)
