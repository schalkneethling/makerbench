import * as React from "react";
import "./index.css";

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