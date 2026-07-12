type LanguageSettingsProps = {
  onResetPrototypeData: () => void;
};

export function LanguageSettings({ onResetPrototypeData }: LanguageSettingsProps) {
  return (
    <section className="view active-view" data-testid="view-settings">
      <section className="panel settings-panel">
        <p className="eyebrow">Language</p>
        <h3>Language Settings</h3>
        <div className="settings-row">
          <span>Student writing language</span>
          <strong>English</strong>
        </div>
        <div className="settings-row">
          <span>Student feedback</span>
          <strong>English</strong>
        </div>
        <div className="settings-row">
          <span>Parent summary</span>
          <strong>Simplified Chinese</strong>
        </div>
        <div className="settings-row">
          <span>Saved demo data</span>
          <button className="secondary-button" onClick={onResetPrototypeData}>
            Reset demo data
          </button>
        </div>
      </section>
    </section>
  );
}
