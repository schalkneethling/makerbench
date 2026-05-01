import "./index.css";
import PropTypes from "prop-types";

export function SuggestToolButton({ onClick }) {
  return (
    <button
      type="button"
      className="suggest-tool-button"
      onClick={onClick}
      aria-haspopup="dialog"
    >
      Suggest a Tool
    </button>
  );
}

SuggestToolButton.propTypes = {
  onClick: PropTypes.func.isRequired
};