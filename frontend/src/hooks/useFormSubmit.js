import { useState } from 'react';
import { generateDocuments } from '../api/formApi';

export const useFormSubmit = (processName) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const submitForm = async (clientId, caseId, formData, selectedFiles = []) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateDocuments(
        clientId,
        caseId,
        processName,
        formData,
        selectedFiles
      );
      return result;
    } catch (err) {
      setError(err.message || 'An error occurred while generating documents');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { submitForm, loading, error };
};