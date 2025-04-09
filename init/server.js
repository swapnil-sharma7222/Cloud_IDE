"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dockerode_1 = __importDefault(require("dockerode"));
const app = (0, express_1.default)();
const port = 3000;
const docker = new dockerode_1.default();
const imageName = 'divyam121/docker-image';
app.get('/run-container', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        console.log(`Pulling image ${imageName}...`);
        yield new Promise((resolve, reject) => {
            docker.pull(imageName, (err, stream) => {
                if (err)
                    return reject(err);
                docker.modem.followProgress(stream, onFinished, onProgress);
                function onFinished(err) {
                    if (err)
                        return reject(err);
                    resolve(true);
                }
                function onProgress(event) {
                    process.stdout.write('.');
                }
            });
        });
        console.log('\nImage pulled.');
        const containerName = 'amazing_agnesi';
        // Check if container exists
        const containers = yield docker.listContainers({ all: true });
        const existingContainerInfo = containers.find((c) => c.Names.includes(`/${containerName}`));
        if (existingContainerInfo) {
            const existingContainer = docker.getContainer(existingContainerInfo.Id);
            if (existingContainerInfo.State === 'running') {
                console.log('Stopping existing container...');
                yield existingContainer.stop();
            }
            console.log('Removing existing container...');
            yield existingContainer.remove();
        }
        // Create and start new container
        console.log('Creating and starting container...');
        const container = yield docker.createContainer({
            Image: imageName,
            name: containerName,
            Tty: true,
        });
        yield container.start();
        console.log(`Container started with ID: ${container.id}`);
        res.send(`Container started with ID: ${container.id}`);
    }
    catch (err) {
        console.error('Error:', err);
        res.status(500).send('Failed to pull and run the container.');
    }
}));
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
