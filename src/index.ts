class App {
    canvas: HTMLCanvasElement;
    context: CanvasRenderingContext2D;

    preview_canvas: HTMLCanvasElement;
    preview_context: CanvasRenderingContext2D;

    frames: Frame[] = [];
    currentFrameIndex: number = 0;
    sizeX: number;
    sizeY: number;
    animating: boolean = false;

    framesSelect: HTMLDivElement;

    playButton: HTMLDivElement;
    animSpeedSlider: HTMLInputElement;
    animSpeedSliderLabel: HTMLLabelElement;

    btnAddFrame: HTMLButtonElement;
    btnDelFrame: HTMLButtonElement;

    outputDiv: HTMLDivElement;

    frameSpeed: number = 10;
    _timer: number = 0;
    _animationFrameIdx: number = 0;
    _lastMillis: number = 0;

    constructor() {
        this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
        this.canvas.width = 512;
        this.canvas.height = 512;
        this.context = this.canvas.getContext('2d') as CanvasRenderingContext2D;

        this.preview_canvas = document.getElementById('preview-canvas') as HTMLCanvasElement;
        this.preview_canvas.width = 768 - this.canvas.width - 30;
        this.preview_canvas.width = Math.min(this.preview_canvas.width, 100);
        this.preview_canvas.height = this.preview_canvas.width;
        this.preview_context = this.preview_canvas.getContext('2d') as CanvasRenderingContext2D;

        this.canvas.addEventListener("mousedown", this.onCanvasClicked);

        this.framesSelect = document.getElementById('frames') as HTMLDivElement;

        this.playButton = document.getElementById('play-stop-btn') as HTMLDivElement;
        this.playButton.addEventListener('click', this.onPlayStopClick);

        this.animSpeedSlider = document.getElementById('animation-speed-slider') as HTMLInputElement;
        this.animSpeedSliderLabel = document.getElementById('anim-speed-label') as HTMLLabelElement;
        this.animSpeedSlider.addEventListener('input', (e: Event) => {
            const val = parseFloat(this.animSpeedSlider.value);
            this.frameSpeed = val;
            this.animSpeedSliderLabel.innerText = val.toString();
        });

        this.btnAddFrame = document.querySelector('#frame-btns button:nth-child(1)') as HTMLButtonElement;
        this.btnDelFrame = document.querySelector('#frame-btns button:nth-child(2)') as HTMLButtonElement;
        this.btnAddFrame.addEventListener('click', this.addFrame);
        this.btnDelFrame.addEventListener('click', this.delFrame);


        this.outputDiv = document.getElementById('output') as HTMLDivElement;

        this.sizeX = 8;
        this.sizeY = 8;
        this.addFrame();

        this.redraw();
    }

    onPlayStopClick = (ev: MouseEvent) => {
        if (!this.animating) {
            this.animating = true;
            this.playButton.innerText = "STOP";
            this._timer = 0;
            this._animationFrameIdx = 0;
            this.animate(performance.now());
        } else {
            this.animating = false;
            this.playButton.innerText = "PLAY";
        }
    }

    animate = (millis: number) => {

        const delta = millis - this._lastMillis;
        this._lastMillis = millis;
        this._timer += delta;
        if (this._timer > 1000 / this.frameSpeed) {
            this._timer = 0;
            (this.framesSelect.children.item(this._animationFrameIdx) as HTMLDivElement)
                .classList.remove('preview-current');
            this._animationFrameIdx = (this._animationFrameIdx + 1) % this.frames.length;
            (this.framesSelect.children.item(this._animationFrameIdx) as HTMLDivElement)
                .classList.add('preview-current');
        }

        this.drawPreview(this.preview_canvas, this.preview_context);
        if (this.animating)
            requestAnimationFrame(this.animate);
    }

    addFrame = () => {
        this.frames.push(new Frame(this.sizeX, this.sizeY));
        this.currentFrameIndex = this.frames.length - 1;

        const frameElement = document.createElement('div');
        frameElement.className = "frame frame-current";
        frameElement.addEventListener('click', this.onBtnSelectFrameClicked.bind(this));

        this.framesSelect.appendChild(frameElement);
        this.selectFrame(this.currentFrameIndex);
    }

    delFrame = () => {
        if (this.frames.length == 1) {
            return;
        }

        const lastIdx = this.frames.length - 1;
        this.frames = this.frames.slice(0, lastIdx);
        this.framesSelect.removeChild(this.framesSelect.lastElementChild as Element);

        if (this.currentFrameIndex >= lastIdx - 1)
            this.selectFrame(lastIdx - 1);
        else
            this.selectFrame(this.currentFrameIndex);
    }

    onBtnSelectFrameClicked = (ev: MouseEvent) => {
        const frameClicked = ev.target as HTMLDivElement;
        const idx = Array.prototype.indexOf.call(this.framesSelect.children, frameClicked);
        this.selectFrame(idx);
    }

    selectFrame = (idx: number) => {
        this.currentFrameIndex = idx;
        this.framesSelect.childNodes.forEach(e => {(e as HTMLDivElement).className = "frame"});
        (this.framesSelect.children.item(idx) as HTMLDivElement).className = "frame frame-current";
        this.redraw();
    }

    onCanvasClicked = (e: MouseEvent) => {
        let mouseX = e.pageX - this.canvas.offsetLeft;
        let mouseY = e.pageY - this.canvas.offsetTop;

        let cx = this.getCellX(mouseX);
        let cy = this.getCellY(mouseY);
        this.frames[this.currentFrameIndex].togglePixel(cx, cy);
        this.redraw();
    }

    drawPreview = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const cellSize = canvas.height / this.sizeY;

        const frameIdx = this.animating ? this._animationFrameIdx : this.currentFrameIndex;

        // Draw pixels
        ctx.fillStyle = 'black';
        const frame = this.frames[frameIdx];
        for (let y = 0; y < frame.height ; y++) {
            for (let x = 0; x < frame.width ; x++) {
                if (frame.getPixel(x, y) == true) {
                    ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
                }
            }
        }
    }

    redraw = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // this.context.fillStyle = 'black';
        // this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);

        const cellSize = this.canvas.height / this.sizeY;

        // Draw pixels
        const frame = this.frames[this.currentFrameIndex];
        for (let y = 0; y < frame.height ; y++) {
            for (let x = 0; x < frame.width ; x++) {
                if (frame.getPixel(x, y) == true) {
                    this.context.fillStyle = 'black';
                } else {
                    this.context.fillStyle = 'white';
                }
                this.context.fillRect(x * cellSize, y * cellSize, cellSize, cellSize);
            }
        }

        // Draw grid lines
        this.context.lineWidth = 1;
        for (let y = 1; y < this.sizeY; y++) {
            this.context.beginPath();
            this.context.moveTo(0, y * cellSize);
            this.context.lineTo(this.canvas.width, y * cellSize);
            this.context.stroke();
        }
        for (let x = 0; x < this.sizeX; x++) {
            this.context.beginPath();
            this.context.moveTo(x * cellSize, 0);
            this.context.lineTo(x * cellSize, this.canvas.height);
            this.context.stroke();
        }

        this.updateOutput();
        if (!this.animating) {
            this.drawPreview(this.preview_canvas, this.preview_context);
        }
    }

    getCellX(screenX: number) : number {
        const cellSize = this.canvas.height / this.sizeY;
        return Math.floor(screenX / cellSize);
    }
    getCellY(screenY: number) : number {
        const cellSize = this.canvas.height / this.sizeY;
        return Math.floor(screenY / cellSize);
    }

    updateOutput = () => {
        const output = this.frames.reduce((acc, curr) => acc += "\n" + curr.toHexString(), "")
        this.outputDiv.innerHTML = "<pre>" + output + "</pre>";
    }

}

class Frame {
    width: number;
    height: number;
    pixels: boolean[][] = [];

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
        for (let y = 0; y < height; y++) {
            this.pixels[y] = [];
            for (let x = 0; x < width; x++) {
                this.pixels[y][x] = false;
            }
        }
    }

    getPixel(x: number, y: number): boolean {
        return this.pixels[y][x];
    }
    setPixel(x: number, y: number, val: boolean): void {
        this.pixels[y][x] = val;
    }
    togglePixel(x: number, y: number): void {
        this.setPixel(x, y, !this.getPixel(x, y));
    }
    toHexString(): string {
        let str: string = "";

        for (let y = 0; y < this.height; y++) {
            let acc = 0;
            for (let x = 0; x < this.width; x++) {
                if (this.getPixel(x, y))
                    acc += (1 << (this.width - x - 1));
            }
            str += "0x" + acc.toString(16).padStart(2, '0') + ", ";
        }

        return str;
    }
}

new App();