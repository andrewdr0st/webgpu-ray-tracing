let adapter;
let device;
let computeContext;
let textureLayout;
let computePipeline;

const canvas = document.getElementById("canvas");

async function setupDevice() {
    adapter = await navigator.gpu?.requestAdapter();
    device = await adapter?.requestDevice();
    if (!device) {
        alert("Browser or device does not support WebGPU");
        return false;
    }

    computeContext = canvas.getContext("webgpu");
    computeContext.configure({
        device,
        format: "rgba8unorm",
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING
    });

    return true;
}

async function loadWGSLShader(f) {
    let response = await fetch(f);
    return await response.text();
}

async function init() {
    if (await setupDevice()) {
        textureLayout = device.createBindGroupLayout({
            entries: [{
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {format: "rgba8unorm"}
            }]
        });

        const computeLayout = device.createPipelineLayout({bindGroupLayouts: [textureLayout]});
        const shader = await loadWGSLShader("compute.wgsl");
        const module = device.createShaderModule({code: shader});
        computePipeline = device.createComputePipeline({
            layout: computeLayout,
            compute: {module: module}
        });

        draw();
    }
}

function draw() {
    const canvasTexture = computeContext.getCurrentTexture();
    const textureBindGroup = device.createBindGroup({
        layout: textureLayout,
        entries: [{binding: 0, resource: canvasTexture.createView()}]
    });

    const workgroupX = Math.ceil(canvas.width / 8);
    const workgroupY = Math.ceil(canvas.height / 8);

    const encoder = device.createCommandEncoder();
    const pass = encoder.beginComputePass();
    pass.setPipeline(computePipeline);
    pass.setBindGroup(0, textureBindGroup);
    pass.dispatchWorkgroups(workgroupX, workgroupY, 1);
    pass.end();
    
    const commandBuffer = encoder.finish();
    device.queue.submit([commandBuffer]);
}

init();