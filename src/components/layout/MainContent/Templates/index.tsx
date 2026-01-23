import { useState, useEffect } from "react";
import { Trash2, Edit, Save, Plus } from "lucide-react";

interface Template {
  name: string;
  prompt: string;
  variableKeys: string[];
}

function TemplatesPage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [editingTemplateName, setEditingTemplateName] = useState<string | null>(null);
  const [editedPrompt, setEditedPrompt] = useState<string>("");
  const [editedVariableKeys, setEditedVariableKeys] = useState<string[]>([]);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    const savedTemplates = localStorage.getItem("promptTemplates");
    if (savedTemplates) {
      setTemplates(JSON.parse(savedTemplates));
    }
  };

  const saveTemplates = (updatedTemplates: Template[]) => {
    localStorage.setItem("promptTemplates", JSON.stringify(updatedTemplates));
    setTemplates(updatedTemplates);
  };

  const handleDeleteTemplate = (templateName: string) => {
    if (window.confirm(`Are you sure you want to delete template "${templateName}"?`)) {
      const updatedTemplates = templates.filter((t) => t.name !== templateName);
      saveTemplates(updatedTemplates);
    }
  };

  const handleEditTemplate = (template: Template) => {
    setEditingTemplateName(template.name);
    setEditedPrompt(template.prompt);
    setEditedVariableKeys(template.variableKeys);
  };

  const handleSaveEdit = () => {
    if (editingTemplateName) {
      const updatedTemplates = templates.map((t) =>
        t.name === editingTemplateName
          ? { name: editingTemplateName, prompt: editedPrompt, variableKeys: editedVariableKeys }
          : t
      );
      saveTemplates(updatedTemplates);
      setEditingTemplateName(null);
      setEditedPrompt("");
      setEditedVariableKeys([]);
    }
  };

  const handleAddVariableKey = () => {
    setEditedVariableKeys([...editedVariableKeys, ""]);
  };

  const handleVariableKeyChange = (index: number, value: string) => {
    const newKeys = [...editedVariableKeys];
    newKeys[index] = value;
    setEditedVariableKeys(newKeys);
  };

  const handleRemoveVariableKey = (index: number) => {
    const newKeys = editedVariableKeys.filter((_, i) => i !== index);
    setEditedVariableKeys(newKeys);
  };


  return (
    <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
      <h2 className="text-xl font-bold text-text-main mb-6">Prompt Templates</h2>
      {templates.length === 0 ? (
        <p className="text-text-muted">No templates saved yet. Go to the Studio tab to create one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.name} className="bg-white border border-border-light rounded-lg shadow-sm p-6 flex flex-col">
              <h3 className="text-lg font-semibold text-primary mb-2">{template.name}</h3>
              <p className="text-text-muted text-sm flex-1 mb-4 line-clamp-3">{template.prompt}</p>
              <div className="flex justify-end gap-3 mt-4">
                <button
                  onClick={() => handleEditTemplate(template)}
                  className="text-text-muted hover:text-blue-500 transition-colors"
                  title="Edit Template"
                >
                  <Edit size={18} />
                </button>
                <button
                  onClick={() => handleDeleteTemplate(template.name)}
                  className="text-text-muted hover:text-red-500 transition-colors"
                  title="Delete Template"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal/Form */}
      {editingTemplateName && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-8 w-full max-w-2xl">
            <h3 className="text-xl font-bold mb-4">Edit Template: {editingTemplateName}</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main mb-1">Prompt Content</label>
              <textarea
                className="w-full p-3 border border-border-light rounded-lg text-sm"
                rows={8}
                value={editedPrompt}
                onChange={(e) => setEditedPrompt(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-main mb-1">Variable Keys</label>
              <div className="space-y-2">
                {editedVariableKeys.map((key, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={key}
                      onChange={(e) => handleVariableKeyChange(index, e.target.value)}
                      className="flex-1 p-2 border border-border-light rounded-lg text-sm"
                      placeholder="Variable Key"
                    />
                    <button
                      onClick={() => handleRemoveVariableKey(index)}
                      className="text-text-muted hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddVariableKey}
                className="mt-3 flex items-center gap-1 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
              >
                <Plus size={16} />
                ADD VARIABLE KEY
              </button>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setEditingTemplateName(null)}
                className="px-4 py-2 text-sm font-medium text-text-main border border-border-light rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-lg hover:bg-primary/80"
              >
                <Save size={16} className="inline-block mr-2" />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TemplatesPage;
