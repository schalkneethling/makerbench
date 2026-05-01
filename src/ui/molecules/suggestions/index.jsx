import PropTypes from "prop-types";

export const Suggestions = ({ tools }) => {
  const suggestionsSet = new Set();
  let allTags = [];

  allTags = tools.map((tool) => tool.tag);
  const flattenedTags = allTags.flat();
  flattenedTags.forEach((tag) => suggestionsSet.add(tag));

  return (
    <datalist data-testid="suggestions-datalist" id="suggestions">
      {Array.from(suggestionsSet).map((suggestion) => {
        return <option key={suggestion} value={suggestion} />;
      })}
    </datalist>
  );
};

Suggestions.propTypes = {
  tools: PropTypes.arrayOf(
    PropTypes.shape({
      tag: PropTypes.array.isRequired
    })
  ).isRequired
};
