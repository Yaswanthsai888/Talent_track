import requests
import os
import time

def wait_for_service(url, max_retries=5, delay=2):
    """Wait for service to become available"""
    for i in range(max_retries):
        try:
            response = requests.get(url)
            if response.status_code == 200:
                return True
        except requests.exceptions.ConnectionError:
            print(f"Service not ready, attempt {i+1} of {max_retries}")
            time.sleep(delay)
    return False

def test_resume_parser():
    print("Testing Resume Parser Service...")
    
    # Wait for service to be ready
    if not wait_for_service('http://localhost:5001/health'):
        print("Service failed to start")
        return

    # Create test directory if it doesn't exist
    os.makedirs('test_resumes', exist_ok=True)

    # Create a test PDF file if it doesn't exist
    test_file = os.path.join('test_resumes', 'Yaswanth_Sai_Podapati.pdf')
    if not os.path.exists(test_file):
        with open(test_file, 'w') as f:
            f.write("Test Resume\n\nSkills: Python, JavaScript, React")

    try:
        with open(test_file, 'rb') as f:
            files = {'file': ('test_resume.pdf', f, 'application/pdf')}
            response = requests.post('http://localhost:5001/parse-resume', files=files)
            
        print("\nParser Response:")
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
        
    except Exception as e:
        print(f"Test failed: {str(e)}")

if __name__ == "__main__":
    test_resume_parser()
