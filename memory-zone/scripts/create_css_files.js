const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');

const css1 = `/* ═══════════════════════════════════════════════════════════════
   TEXT INPUT — Sprint_04  |  All values use design tokens only
   ═══════════════════════════════════════════════════════════════ */

.vs-text-input-wrapper { display: flex; flex-direction: column; gap: 0; }
.vs-text-input-wrapper--full-width { width: 100%; }

.vs-text-input-label {
  display: flex; align-items: center; gap: var(--space-1);
  font-family: var(--font-family-primary);
  font-size: var(--text-md); font-weight: var(--font-medium);
  color: var(--color-text-primary); line-height: var(--leading-normal);
  margin-bottom: var(--space-1-5); user-select: none;
}
.vs-text-input-label--required::after {
  content: "*"; color: var(--color-danger-500);
  font-weight: var(--font-semibold); margin-left: var(--space-0-5);
}

.vs-text-input-container {
  position: relative; display: flex; align-items: center;
  width: 100%; min-width: 160px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-default) solid var(--color-border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--motion-fast) var(--ease-standard),
              box-shadow var(--motion-fast) var(--ease-standard);
}
.vs-text-input-container--sm { height: var(--space-9); }
.vs-text-input-container--md { height: var(--space-10); }
.vs-text-input-container--lg { height: var(--space-11); }

.vs-text-input {
  width: 100%; height: 100%; padding: 0 var(--space-3);
  border: none; outline: none; background: transparent;
  font-family: var(--font-family-primary);
  font-size: var(--text-md); font-weight: var(--font-regular);
  color: var(--color-text-primary); line-height: var(--leading-normal);
}
.vs-text-input::placeholder {
  font-size: var(--text-md); font-weight: var(--font-regular);
  color: var(--color-text-secondary);
}

.vs-text-input-prefix, .vs-text-input-suffix {
  display: inline-flex; align-items: center; justify-content: center;
  flex-shrink: 0; width: var(--text-lg); height: var(--text-lg);
  color: var(--color-text-secondary);
}
.vs-text-input-prefix { margin-left: var(--space-3); }
.vs-text-input-suffix { margin-right: var(--space-3); }

.vs-text-input-container:not(.vs-text-input-container--disabled):not(.vs-text-input-container--error):hover {
  border-color: var(--color-primary-300);
}
.vs-text-input-container:not(.vs-text-input-container--disabled):focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px var(--color-primary-100);
}
.vs-text-input-container--error { border-color: var(--color-danger-500); }
.vs-text-input-container--error:not(.vs-text-input-container--disabled):focus-within {
  border-color: var(--color-danger-500);
  box-shadow: 0 0 0 2px var(--color-danger-100);
}
.vs-text-input-container--disabled {
  background-color: var(--color-bg-disabled); cursor: not-allowed; opacity: var(--opacity-70);
}
.vs-text-input-container--disabled .vs-text-input { cursor: not-allowed; }

.vs-text-input-helper {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-text-secondary); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
.vs-text-input-error {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-danger-500); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
`;

const css2 = `/* ═══════════════════════════════════════════════════════════════
   SELECT INPUT — Sprint_04  |  All values use design tokens only
   ═══════════════════════════════════════════════════════════════ */

.vs-select-wrapper { display: flex; flex-direction: column; gap: 0; }
.vs-select-wrapper--full-width { width: 100%; }

.vs-select-label {
  display: flex; align-items: center; gap: var(--space-1);
  font-family: var(--font-family-primary);
  font-size: var(--text-md); font-weight: var(--font-medium);
  color: var(--color-text-primary); line-height: var(--leading-normal);
  margin-bottom: var(--space-1-5); user-select: none;
}
.vs-select-label--required::after {
  content: "*"; color: var(--color-danger-500);
  font-weight: var(--font-semibold); margin-left: var(--space-0-5);
}

.vs-select-container {
  position: relative; display: flex; align-items: center;
  width: 100%; min-width: 160px;
  background-color: var(--color-bg-primary);
  border: var(--border-width-default) solid var(--color-border-default);
  border-radius: var(--radius-md);
  transition: border-color var(--motion-fast) var(--ease-standard),
              box-shadow var(--motion-fast) var(--ease-standard);
}
.vs-select-container--sm { height: var(--space-9); }
.vs-select-container--md { height: var(--space-10); }
.vs-select-container--lg { height: var(--space-11); }

.vs-select {
  width: 100%; height: 100%;
  padding: 0 var(--space-8) 0 var(--space-3);
  border: none; outline: none; background: transparent;
  font-family: var(--font-family-primary);
  font-size: var(--text-md); font-weight: var(--font-regular);
  color: var(--color-text-primary); line-height: var(--leading-normal);
  cursor: pointer;
  -webkit-appearance: none; -moz-appearance: none; appearance: none;
}

.vs-select-arrow {
  position: absolute; right: var(--space-3); top: 50%;
  transform: translateY(-50%); pointer-events: none;
  color: var(--color-text-secondary);
  display: inline-flex; align-items: center; justify-content: center;
  width: var(--text-lg); height: var(--text-lg); flex-shrink: 0;
}

.vs-select-container:not(.vs-select-container--disabled):not(.vs-select-container--error):hover {
  border-color: var(--color-primary-300);
}
.vs-select-container:not(.vs-select-container--disabled):focus-within {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px var(--color-primary-100);
}
.vs-select-container--error { border-color: var(--color-danger-500); }
.vs-select-container--error:not(.vs-select-container--disabled):focus-within {
  border-color: var(--color-danger-500);
  box-shadow: 0 0 0 2px var(--color-danger-100);
}
.vs-select-container--disabled {
  background-color: var(--color-bg-disabled); cursor: not-allowed; opacity: var(--opacity-70);
}
.vs-select-container--disabled .vs-select { cursor: not-allowed; }

.vs-select-helper {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-text-secondary); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
.vs-select-error {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-danger-500); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
`;

const css3 = `/* ═══════════════════════════════════════════════════════════════
   FORM FIELD — Sprint_04  |  All values use design tokens only
   ═══════════════════════════════════════════════════════════════ */

.vs-form-field { display: flex; flex-direction: column; gap: 0; width: 100%; }

.vs-form-field-label-row {
  display: flex; align-items: center; gap: var(--space-1);
  margin-bottom: var(--space-1);
}
.vs-form-field-label {
  font-family: var(--font-family-primary);
  font-size: var(--text-md); font-weight: var(--font-medium);
  color: var(--color-text-primary); line-height: var(--leading-normal);
  user-select: none;
}
.vs-form-field-label--required::after {
  content: "*"; color: var(--color-danger-500);
  font-weight: var(--font-semibold); margin-left: var(--space-0-5);
}

.vs-form-field-description {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-text-secondary); line-height: var(--leading-normal);
  margin-bottom: var(--space-1-5);
}

.vs-form-field-content { flex: 1; }

.vs-form-field-helper {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-text-secondary); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
.vs-form-field-error {
  font-family: var(--font-family-primary);
  font-size: var(--text-xs); font-weight: var(--font-regular);
  color: var(--color-danger-500); line-height: var(--leading-normal);
  margin-top: var(--space-1);
}
`;

try {
  fs.writeFileSync(path.join(baseDir, 'components', 'TextInput.css'), css1, 'utf8');

  fs.writeFileSync(path.join(baseDir, 'components', 'SelectInput.css'), css2, 'utf8');

  fs.writeFileSync(path.join(baseDir, 'components', 'FormField.css'), css3, 'utf8');


} catch (err) {

}