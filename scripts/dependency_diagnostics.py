#!/usr/bin/env python3
import sys
import subprocess
import platform
import json
import os

def check_python_environment():
    """Comprehensive Python environment diagnostic"""
    diagnostics = {
        "python_version": sys.version,
        "python_executable": sys.executable,
        "platform": platform.platform(),
        "architecture": platform.architecture(),
        "pip_version": None,
        "installed_packages": None
    }

    try:
        pip_version = subprocess.check_output([sys.executable, '-m', 'pip', '--version']).decode().strip()
        diagnostics['pip_version'] = pip_version
    except Exception as e:
        diagnostics['pip_version'] = f"Error: {str(e)}"

    try:
        installed_packages = subprocess.check_output([sys.executable, '-m', 'pip', 'list']).decode().strip()
        diagnostics['installed_packages'] = installed_packages
    except Exception as e:
        diagnostics['installed_packages'] = f"Error: {str(e)}"

    return diagnostics

def install_dependencies(requirements_path):
    """Install dependencies with detailed logging"""
    try:
        result = subprocess.run([
            sys.executable, 
            '-m', 'pip', 
            'install', 
            '-r', 
            requirements_path,
            '--verbose'
        ], capture_output=True, text=True)
        
        return {
            'success': result.returncode == 0,
            'stdout': result.stdout,
            'stderr': result.stderr
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def generate_dependency_report(requirements_path):
    """Generate comprehensive dependency installation report"""
    print("🔍 Running Python Environment Diagnostics...")
    env_diagnostics = check_python_environment()
    
    print("\n🚀 Attempting to Install Dependencies...")
    install_result = install_dependencies(requirements_path)

    report = {
        'environment': env_diagnostics,
        'dependency_installation': install_result
    }

    report_path = os.path.join(os.path.dirname(requirements_path), 'dependency_report.json')
    
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)

    print(f"\n📄 Detailed report saved to {report_path}")
    
    if not install_result['success']:
        print("\n❌ Dependency Installation Failed. See report for details.")
        print("Troubleshooting Tips:")
        print("1. Ensure you have the latest pip version")
        print("2. Check your Python version compatibility")
        print("3. Verify network connection")
        print("4. Try installing dependencies one by one")
    else:
        print("\n✅ Dependencies Installed Successfully!")

def main():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    requirements_path = os.path.join(project_root, 'requirements.txt')
    generate_dependency_report(requirements_path)

if __name__ == "__main__":
    main()
