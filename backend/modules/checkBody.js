// Vérifie que tous les champs requis d’un objet sont présents et non vides.

function checkBody(body, keys) {
    let isValid = true;
  
    for (const field of keys) {
      if (!body[field] || body[field] === '') {
        isValid = false;
      }
    }
  
    return isValid;
  }
  
  module.exports = { checkBody };