/**
 * Document editor configuration and initial content
 */

export const INITIAL_CONTENT = `
  <p>This is a rich text editor built with Tiptap. You can format your text in various ways:</p>

  <h2>Text Formatting</h2>
  <p>You can make text <strong>bold</strong>, <em>italic</em>, <u>underline</u>, or <s>strikethrough</s>.</p>

  <h2>Lists</h2>
  <p>Create bulleted lists:</p>
  <ul>
    <li>First item</li>
    <li>Second item</li>
    <li>Third item</li>
  </ul>

  <p>Or numbered lists:</p>
  <ol>
    <li>Step one</li>
    <li>Step two</li>
    <li>Step three</li>
  </ol>

  <h2>Code Blocks</h2>
  <pre><code>function hello() {
  console.log('Hello, world!');
}</code></pre>

  <h2>Blockquotes</h2>
  <blockquote>
    <p>This is a blockquote. Use it for important callouts or quotes.</p>
  </blockquote>

  <p>Start editing to see the magic happen!</p>
`;

export const DEFAULT_DOCUMENT = {
	title: "Demo Live page",
	author: {
		name: "Charlie Atlas",
		avatar: "/avatar-human/andrea-wilson.png",
	},
	readTime: "3 min",
} as const;
