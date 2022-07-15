
import { fromFileUrl , join , dirname , basename } from 'Path'
import { parse } from 'YAML'
import { walk } from 'FileSystem'


const { log } = console;

const { writeTextFile , readTextFile } = Deno;


const folder = dirname(fromFileUrl(import.meta.url));
const root = join(folder,'..');

const data = join(root,'Data');
const games = join(root,'Games');


for await (const entry of walk(data,{
    includeFiles : true ,
    includeDirs : false ,
    exts : [ 'yaml' ]
})){
    
    const { path } = entry;
    
    const yaml = await readTextFile(path);
    const data = parse(yaml);
    
    const
        raftmoddings = [] ,
        githubs = [] ,
        gitlabs = [] ;
        
    const mods = [];
        
    data.forEach((mod) => {
        const { name , license , gitlab , github , raftmodding } = mod;
        
        if(raftmodding)
            raftmoddings.push({ name , link : raftmodding });
        
        if(github)
            githubs.push({ name , link : github });
        
        if(gitlab)
            gitlabs.push({ name , link : gitlab });
        
        let platform = 'GitHub';
        
        if(gitlab)
            platform = 'GitLab';
        
        mods.push({ name , license , platform });
    });
    
    
    const generators = {
        Table : generateTable ,
        GitHub : generateGitHub ,
        GitLab : generateGitLab ,
        RaftModding : generateRaftModding
    }
    
    function generateTable(){
        return `| Mod | Repository | RaftModding | License\n` +
        `|:---:|:------:|:-----------:|:-------:\n` + 
        mods.map(({ name , license , platform }) => {
            return `| \`${ name }\` | [![Button ${ platform }]][${ platform } ${ name }] | [![Button RaftModding]][RaftModding ${ name }] | <kbd>  ${ license }  </kbd>\n`;
        }).join('');
    }
    
    function generateGitHub(){
        return githubs.map(({ name , link }) => `[GitHub ${ name }]: https://GitHub.com/${ link }\n`).join('')
    }
    
    function generateGitLab(){
        return gitlabs.map(({ name , link }) => `[GitLab ${ name }]: https://GitLab.com/${ link }\n`).join('')
    }
    
    function generateRaftModding(){
        return raftmoddings.map(({ name , link }) => `[RaftModding ${ name }]: https://www.raftmodding.com/mods/${ link }\n`).join('')
    }
    
    
    const markdown_path = join(games,basename(path).slice(0,-4) + 'md');
    log(markdown_path)
    const markdown = await readTextFile(markdown_path);
    
    const converted = markdown.replace(/\<\!\-\- \> *\S+ *\-\-\>\n([^\n]+\n)*/gm,(match) => {
        
        const type = match
            .split('\n')[0]
            .trim()
            .substring(6)
            .slice(0,-3)
            .trim();
            
        let generated = `<!-- Unknown Insert Type : ${ type } -->\n`;
        
        if(type in generators)
            generated = generators[type]();
        
        return `<!-- > ${ type } -->\n${ generated }`;
    });
    
    writeTextFile(markdown_path,converted);
}
