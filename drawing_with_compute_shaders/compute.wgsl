@group(0) @binding(0) var tex: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8, 1) fn rayColor(@builtin(global_invocation_id) id: vec3u) {
    let width = textureDimensions(tex).x;
    let height = textureDimensions(tex).y;
    if (id.x > width || id.y > height) {
        return;
    }

    let x = f32(id.x) / f32(width);
    let y = f32(id.y) / f32(height);

    textureStore(tex, id.xy, vec4f(0.5, x, y, 1.0));
}