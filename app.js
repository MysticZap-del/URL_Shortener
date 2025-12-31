// creating a server sice we want to show the html page on the localhost
import {createServer} from 'http';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const PORT = 3000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const loadLinks = async() => {
    try {
      const data = await fs.promises.readFile(path.join('data', 'links.json'), 'utf-8');
      return JSON.parse(data);
    } catch (error) {
        if(error.code === 'ENOENT'){
            await fs.promises.writeFile(path.join('data','links.json'), JSON.stringify({}), 'utf-8');
            return {};
        }
    }
}

const saveLinks = async(links) => {
    await fs.promises.writeFile(path.join('data', 'links.json'), JSON.stringify(links), 'utf-8');
}
const server = createServer(async(req, res) => {
    if(req.method === 'GET'){
        if(req.url === '/'){
            try {
                const filePath = path.join(__dirname, 'index.html');
                const data = await fs.promises.readFile(filePath, 'utf-8');
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(data);
            } catch (error) {
                res.writeHead(404, {'Content-Type': 'text/html'});
                res.end('404: Error loading the home page');
            }
        }
        else if(req.url === '/style.css'){
            try {
                const filePath = path.join(__dirname, 'style.css');
                const data = await fs.promises.readFile(filePath, 'utf-8');
                res.writeHead(200, {'Content-Type': 'text/css'});
                res.end(data);
            } catch (error) {
                res.writeHead(404, {'Content-Type': 'text/css'});
                res.end('404: Error loading the home page');
            }
        }
    }

    if(req.method === 'POST' && req.url === '/shorten'){

        const links = await loadLinks();
        let body = '';
        req.on('data', (chunk) => {
            body += chunk;
        })

        req.on('end', async() => {
            const {url, shortcode} = JSON.parse(body);

            if(!url){
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'URL is required'}));
            }

            // Check if shortcode is provided or already present or not, else generate a random one
            const finalShortCode = shortcode || crypto.randomBytes(3).toString('hex');
            if(links[finalShortCode]){
                res.writeHead(404, {'Content-Type': 'application/json'});
                res.end(JSON.stringify({error: 'Shortcode already in use'}));
            }
            //this is how we are saving the user response in links.json file
            links[finalShortCode] = url;
            await saveLinks(links);

            res.writeHead(200, {'Content-Type': 'application/json'});
            res.end(JSON.stringify({shortcode: finalShortCode}));
        })
    }
    // handling redirection
if (req.method === 'GET') {
    const links = await loadLinks();
    const shortcode = req.url.slice(1); // remove '/'

    if (shortcode && links[shortcode]) {
        res.writeHead(302, {
            Location: links[shortcode]
        });
        return res.end();
    }
}

})

server.listen(PORT, () => {
    console.log(`Server listening of port: ${PORT}`);
})

