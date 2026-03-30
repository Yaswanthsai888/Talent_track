import os
import json
import time
from typing import List, Dict, Any, Optional
from jinja2 import Template

class PromptManager:
    def __init__(self, templates_dir: str = 'templates'):
        """
        Initialize the prompt manager with a directory for versioned templates.
        """
        self.templates_dir = templates_dir
        os.makedirs(self.templates_dir, exist_ok=True)
        self.current_templates = {}
        self._load_templates()

    def _load_templates(self):
        """
        Load existing templates from the templates directory.
        """
        for filename in os.listdir(self.templates_dir):
            if filename.endswith('.json'):
                template_name = filename[:-5]
                with open(os.path.join(self.templates_dir, filename), 'r') as f:
                    self.current_templates[template_name] = json.load(f)

    def create_template(self, name: str, template_str: str, version: str = 'v1.0') -> str:
        """
        Create a new template or update an existing one with version control.
        """
        template_data = {
            'name': name,
            'template': template_str,
            'version': version,
            'updated_at': time.time()
        }
        
        self.current_templates[name] = template_data
        
        filepath = os.path.join(self.templates_dir, f"{name}.json")
        with open(filepath, 'w') as f:
            json.dump(template_data, f, indent=4)
            
        return f"Template '{name}' (version {version}) saved successfully."

    def generate_prompt(self, template_name: str, context: List[Dict[str, Any]], candidate_data: Dict[str, Any], job_requirements: Dict[str, Any]) -> str:
        """
        Generate a personalized prompt using retrieved context and candidate information.
        """
        if template_name not in self.current_templates:
            raise ValueError(f"Template '{template_name}' not found.")
            
        template_data = self.current_templates[template_name]
        template = Template(template_data['template'])
        
        # Format the context for the prompt
        formatted_context = "\n".join([
            f"- Document: {c.get('title', 'Unknown')}\n  Snippet: {c.get('content', 'No content available.')}\n  Relevance Score: {c.get('score', 0.0):.4f}"
            for c in context
        ])
        
        # Prepare the data for the template
        render_data = {
            'context': formatted_context,
            'candidate_name': candidate_data.get('name', 'Candidate'),
            'candidate_scores': candidate_data.get('scores', {}),
            'job_title': job_requirements.get('title', 'Position'),
            'required_skills': job_requirements.get('required_skills', []),
            'performance_summary': candidate_data.get('performance_summary', 'N/A')
        }
        
        return template.render(**render_data)

if __name__ == "__main__":
    # Example usage
    pm = PromptManager()
    
    # Define a default template for feedback generation
    feedback_template = """
    You are an expert technical interviewer evaluating a candidate for the {{ job_title }} position.
    
    JOB REQUIREMENTS:
    - Skills: {{ required_skills | join(', ') }}
    
    RELEVANT CONTEXT (Retrieved from knowledge base):
    {{ context }}
    
    CANDIDATE PERFORMANCE ({{ candidate_name }}):
    - Overall Scores: {{ candidate_scores }}
    - Summary: {{ performance_summary }}
    
    TASK:
    Generate a detailed and professional feedback report for the candidate. 
    Include:
    1. A summary of strengths based on their test performance and job alignment.
    2. Specific areas for improvement identified during the evaluation.
    3. Three targeted follow-up questions for the next interview round that probe deeper into the identified gaps.
    
    Ensure the feedback is constructive, personalized, and reflects the retrieved context accurately.
    """
    
    pm.create_template('candidate_feedback', feedback_template, version='v1.0')
    print("Default template created.")
