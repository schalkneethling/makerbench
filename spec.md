# Suggest a tool

MakerBench is an online web app that allows developers and designers to add tools to a list maintained as a JSON file in `public/tools.json`. Each tool consists of the following:

```json
{
  "id": 0,
  "title": "Codepen.io",
  "url": "https://codepen.io/",
  "description": "CodePen is a social development environment for front-end designers and developers. Build and deploy a website, show off your work, build test cases to learn and debug, and find inspiration.",
  "logo": "codepen.png",
  "tag": ["repl", "editor"],
  "repo": "https://github.com/codepen"
}
```

> Note: The logo is optional, but when provided should ideally be in SVG or WebP format and should be placed in the `public/logos` directory. The name in the `logo` field should match the filename.

## The challenge

At the moment the JSON file is maintained manually. If a contributor wishes to propose a new tool they need to do so by:

1. Forking the repository
2. Adding the tool to the JSON file
3. Creating a pull request

I suspect this is part of the reason why I recieve so few contributions and why I also do not add tools to the list as often as I probably would if the process was easier.

## A possible solution

When a user lands on MakerBench there is a button at the top right titled, "Suggest a Tool". When clicked, an HTML `<dialog`> modal is opened and the user is presented with a form that allows them to suggest a tool to the list. The form should have the following fields:

- Title [A text input]
- URL [A text input with `type="url"`]
- Description [A textarea]
- Logo [A file input - optional with a max size of 1MB. Also, only PNG, SVG, WebP, and AVIF formats are allowed]
- Tag [A text input that allows the user to add tags separated by commas]
- Repository [A text input with `type="url"` which is optional]

When the user submits the form, the data should be sent to a Netlify serverless function that will:

1. Validate the data
2. Save the logo to the `public/logos` directory
3. Add the tool to the JSON file
4. Ensure the ID is unique and increment it by 1
5. Create a new commit with the changes
6. Create a pull request
7. Send an email to the maintainer of the repository with the details of the new tool

### Some additional notes

- Before getting started, take a moment to get familiar with the existing code base and the various technologies used.
- When the user submits the form, they should see a success message and the form shoudl reset to its initial state. If there are any errors, the form should be updated to show the errors.
- The `<dialog>` should also contain a close button that allows the user to close the modal.
- While this web app is written in React, aim to use as much of the standard web platform as possible and only lean on React and other external libraries as needed and when it will make the task easier.
- Accessibility of all functionality should be top of mind for the implementation.
- Ensure that there are tests in place to validate the functionality as much as reasonably possible. There are already some tests in place using Playwright in `tests`.

## Success criteria

- The user can suggest a tool using the form
- The form is validated and the user is informed of any errors
- The tool is added to the JSON file
- A pull request is created
- An email is sent to the maintainer
- The form resets after a successfull submission
- The `<dialog>` can be closed
- The implementation is accessible
- There are tests in place to validate the functionality

### In closing

Once the work on this feature is complete, please commit and push all the changes to GitHub and create a pull request. There is an issue for this [work on GitHub](https://github.com/schalkneethling/makerbench/issues/493). Please ensure that the work is done on a feature branch that is named `493-suggest-a-tool`.

> Note: Ignore the details in the linked issue and refer to this specification document for the details of the work to be done.

I will review the changes and provide feedback as needed. Once everything is good to go, I will merge the changes and deploy the new version of MakerBench. Thank you for your hard work on this feature!
