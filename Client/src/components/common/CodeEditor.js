import React from 'react';
import AceEditor from 'react-ace';
import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/theme-monokai';

const CodeEditor = ({ value, onChange, language = 'javascript' }) => {
  return (
    <AceEditor
      mode={language}
      theme="monokai"
      onChange={onChange}
      value={value}
      name="code-editor"
      editorProps={{ $blockScrolling: true }}
      setOptions={{
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true,
        showLineNumbers: true,
        tabSize: 2,
      }}
      style={{ width: '100%', height: '400px' }}
    />
  );
};

export default CodeEditor;
