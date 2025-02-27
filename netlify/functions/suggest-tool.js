// Netlify serverless function to handle tool suggestion submissions
import { Octokit } from '@octokit/rest';
import fs from 'fs';
import path from 'path';
import { Buffer } from 'buffer';

// GitHub repo info
const REPO_OWNER = 'schalkneethling';
const REPO_NAME = 'makerbench';

export async function handler(event) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  try {
    console.log('Processing incoming request with headers:', JSON.stringify(event.headers));
    console.log('Content type:', event.headers['content-type'] || event.headers['Content-Type']);
    
    // Parse form data
    console.log('About to parse multipart form data');
    const formData = await parseMultipartForm(event);
    console.log('Form data parsed successfully:', JSON.stringify(formData, null, 2));
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
    console.error('Error stack:', error.stack);
    
    // Provide more debugging info in development
    let errorDetails = {
      message: 'Error processing tool suggestion',
      error: error.message
    };
    
    // Add more details for debugging but be careful not to expose sensitive info
    if (process.env.NODE_ENV !== 'production') {
      errorDetails.stack = error.stack;
      errorDetails.eventHeaders = event.headers;
      errorDetails.eventHttpMethod = event.httpMethod;
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify(errorDetails),
    };
  }
}

// Parse multipart form data without using formidable
async function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    try {
      // Get the content type and boundary
      const contentType = event.headers['content-type'] || event.headers['Content-Type'];
      
      if (!contentType || !contentType.includes('multipart/form-data')) {
        return reject(new Error('Not a multipart form data submission'));
      }
      
      // Get the boundary from the content type
      const boundaryMatch = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
      if (!boundaryMatch) {
        return reject(new Error('No boundary found in content type'));
      }
      
      const boundary = boundaryMatch[1] || boundaryMatch[2];
      
      // Get the body (handle base64 encoding if necessary)
      const body = event.isBase64Encoded
        ? Buffer.from(event.body, 'base64').toString('utf8')
        : event.body;
      
      if (!body) {
        return reject(new Error('Request body is empty or malformed'));
      }
      
      // Split the body by boundary
      const boundaryString = `--${boundary}`;
      const parts = body.split(boundaryString).filter(part => 
        part.trim() !== '' && part.trim() !== '--'
      );
      
      // Process each part
      const formData = {};
      let logoData = null;
      
      for (const part of parts) {
        // Get the headers of the part
        const [headerSection, ...contentSections] = part.split('\r\n\r\n');
        const content = contentSections.join('\r\n\r\n').trim();
        
        // Check if this is a file input or a normal field
        const nameMatch = headerSection.match(/name="([^"]+)"/);
        const filenameMatch = headerSection.match(/filename="([^"]+)"/);
        
        if (!nameMatch) continue; // Skip if no name found
        
        const name = nameMatch[1];
        
        if (filenameMatch) {
          // This is a file input
          const filename = filenameMatch[1];
          
          if (name === 'logo' && filename) {
            // Check MIME type (simple check based on file extension)
            const ext = path.extname(filename).toLowerCase();
            const allowedExts = ['.png', '.svg', '.webp', '.avif'];
            
            if (allowedExts.includes(ext)) {
              // Create a temp file
              const tempPath = `/tmp/${Date.now()}-${filename}`;
              
              // The content includes the trailing \r\n so we need to remove it
              const fileContent = content.replace(/\r\n$/, '');
              
              // Write the file
              fs.writeFileSync(tempPath, fileContent);
              
              // Store file info
              logoData = {
                originalFilename: filename,
                filepath: tempPath,
                // Simplified mimetype detection
                mimetype: ext === '.png' ? 'image/png' : 
                          ext === '.svg' ? 'image/svg+xml' : 
                          ext === '.webp' ? 'image/webp' : 'image/avif'
              };
            }
          }
        } else {
          // This is a regular field
          formData[name] = content;
        }
      }
      
      // Add logo if it exists
      if (logoData) {
        formData.logo = logoData;
      }
      
      resolve(formData);
    } catch (error) {
      console.error('Error parsing multipart form:', error);
      reject(error);
    }
  });
}