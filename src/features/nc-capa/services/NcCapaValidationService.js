class NcCapaValidationService {
  /**
   * Validate NC Draft before creation
   */
  validateDraft(draft) {
    const errors = {};
    if (!draft.title || draft.title.trim() === '') {
      errors.title = 'Title is required';
    }
    if (!draft.description || draft.description.trim() === '') {
      errors.description = 'Description is required';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  }
}

export const ncCapaValidationService = new NcCapaValidationService();
