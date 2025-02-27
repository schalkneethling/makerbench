// Netlify serverless function to handle tool suggestion submissions
import { Octokit } from '@octokit/rest';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';

// GitHub repo info
const REPO_OWNER = 'schalkneethling';
const REPO_NAME = 'makerbench';

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    // Parse form data
    const formData = await parseMultipartForm(event);
    const { title, url, description, tag, repo, logo } = formData;
    
    // Validate required fields
    if (!title || !url || !description || !tag) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    // Parse tags from JSON string to array
    let tags;
    try {
      tags = JSON.parse(tag);
    } catch (e) {
      // Handle case where tags might not be a valid JSON string
      tags = tag.split(',').map(t => t.trim());
    }

    // Initialize GitHub API client using GitHub token from environment variables
    const octokit = new Octokit({
      auth: process.env.GITHUB_TOKEN,
    });

    // 1. Get current tools.json file
    const { data: repoContent } = await octokit.repos.getContent({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'public/tools.json',
      ref: 'main', // Use main branch
    });

    // Decode content from base64
    const toolsJsonContent = Buffer.from(repoContent.content, 'base64').toString();
    const tools = JSON.parse(toolsJsonContent);
    
    // Generate a unique ID (max ID + 1)
    const newId = Math.max(...tools.map(tool => tool.id)) + 1;
    
    // Handle logo file if present
    let logoFilename = null;
    if (logo) {
      // Process logo file
      const fileExt = path.extname(logo.originalFilename).toLowerCase();
      logoFilename = `tool-${newId}${fileExt}`;
      
      // Create a branch if it doesn't exist yet
      try {
        const branchName = `tool-suggestion-${newId}`;
        const { data: mainRef } = await octokit.git.getRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: 'heads/main',
        });
        
        await octokit.git.createRef({
          owner: REPO_OWNER,
          repo: REPO_NAME,
          ref: `refs/heads/${branchName}`,
          sha: mainRef.object.sha,
        });
      } catch (error) {
        // Branch might already exist, continue
        console.log(`Branch creation error (during logo upload): ${error.message}`);
      }
      
      // Read the file and upload it to GitHub
      const logoContent = await fs.promises.readFile(logo.filepath);
      
      // Create a commit to add the logo file
      await octokit.repos.createOrUpdateFileContents({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        path: `public/logos/${logoFilename}`,
        message: `Add logo for tool #${newId}`,
        content: logoContent.toString('base64'),
        branch: `tool-suggestion-${newId}`,
      });
    }
    
    // Create a new tool object
    const newTool = {
      id: newId,
      title,
      url,
      description,
      tag: tags,
      ...(logoFilename && { logo: logoFilename }),
      ...(repo && { repo }),
    };
    
    // Add the new tool to the array
    tools.push(newTool);
    
    // Convert tools array back to JSON string
    const updatedToolsJsonContent = JSON.stringify(tools, null, 2);
    
    // Create a new branch for this PR
    const branchName = `tool-suggestion-${newId}`;
    const { data: mainRef } = await octokit.git.getRef({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      ref: 'heads/main',
    });
    
    // Create a new branch
    try {
      await octokit.git.createRef({
        owner: REPO_OWNER,
        repo: REPO_NAME,
        ref: `refs/heads/${branchName}`,
        sha: mainRef.object.sha,
      });
    } catch (error) {
      // Branch might already exist, continue with the process
      console.log(`Branch creation error: ${error.message}`);
    }
    
    // Update tools.json in the new branch
    await octokit.repos.createOrUpdateFileContents({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      path: 'public/tools.json',
      message: `Add ${title} to tools.json`,
      content: Buffer.from(updatedToolsJsonContent).toString('base64'),
      branch: branchName,
      sha: repoContent.sha,
    });
    
    // Create a pull request
    const { data: pullRequest } = await octokit.pulls.create({
      owner: REPO_OWNER,
      repo: REPO_NAME,
      title: `Add ${title} to tools collection`,
      body: `## New Tool Suggestion\n\n### Title\n${title}\n\n### Description\n${description}\n\n### URL\n${url}\n\n### Tags\n${tags.join(', ')}\n\n${repo ? `### Repository\n${repo}\n\n` : ''}Added via the Suggest a Tool form on MakerBench.`,
      head: branchName,
      base: 'main',
    });
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Tool suggestion submitted successfully',
        pullRequestUrl: pullRequest.html_url,
      }),
    };
  } catch (error) {
    console.error('Error processing tool suggestion:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error processing tool suggestion',
        error: error.message,
      }),
    };
  }
}

// Parse multipart form data using formidable
async function parseMultipartForm(event) {
  // Configure formidable for parsing the multipart form
  const form = formidable({
    maxFileSize: 1024 * 1024, // 1MB file size limit
    filter: (part) => {
      // Filter files by allowed MIME types
      if (part.mimetype) {
        const allowedTypes = ['image/png', 'image/svg+xml', 'image/webp', 'image/avif'];
        return allowedTypes.includes(part.mimetype);
      }
      return true; // Keep all non-file fields
    },
    uploadDir: '/tmp', // Netlify Functions can only write to /tmp
    keepExtensions: true,
  });
  
  return new Promise((resolve, reject) => {
    // Create a stream from the event body
    const bodyStream = new require('stream').Readable();
    
    // Handle base64 encoded bodies (common in serverless functions)
    const body = event.isBase64Encoded 
      ? Buffer.from(event.body, 'base64') 
      : event.body;
      
    bodyStream.push(body);
    bodyStream.push(null); // Signal end of stream
    
    // Parse the stream
    form.parse(bodyStream, (err, fields, files) => {
      if (err) {
        return reject(err);
      }
      
      // Combine fields and files into a single object
      const result = { ...fields };
      
      // Add file information if it exists
      if (files.logo) {
        result.logo = files.logo;
      }
      
      resolve(result);
    });
  });
}