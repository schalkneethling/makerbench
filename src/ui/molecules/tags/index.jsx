import "./index.css";
import PropTypes from "prop-types";

export const Tags = ({ tags, onSubmitCallback }) => {
  return (
    <ul className="tag-list">
      {tags.map((tag, index) => (
        <li key={index}>
          <button type="button" onClick={() => onSubmitCallback(tag)}>
            {tag}
          </button>
        </li>
      ))}
    </ul>
  );
};

Tags.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSubmitCallback: PropTypes.func.isRequired
};
