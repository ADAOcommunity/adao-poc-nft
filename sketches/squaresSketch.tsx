import React, { useEffect, useRef } from 'react'
import p5 from 'p5'
import * as Tone from 'tone'
const Gen = require('total-serialism').Generative;
// const Algo = require('total-serialism').Algorithmic;
// const Mod = require('total-serialism').Transform;
// const Rand = require('total-serialism').Stochastic;
// const Util = require('total-serialism').Utility;
import { TimeBaseClass } from 'tone/build/esm/core/type/TimeBase.js';


export default function Squares(props: { address: string }) {

    let toneWaveform
    let toneFFT
    var synth
    let myP5//p5
    let ready = false;
    let meter;
    // Can be 'sine', 'sawtooth', 'triangle', 'square'
    // Can also add suffixes like sine8, square4
    const type = 'square';

    // Global volume in decibels
    const volume = -15;

    const notes = Gen.sine(16, 1, 36, 72);
    let pattern: any = new Tone.Pattern(function (time, note) {
        synth.triggerAttackRelease(note, "4n");
    }, notes.map((note: string | number | Tone.Unit.TimeObject | TimeBaseClass<any, any>) => Tone.Frequency(note, "midi").toNote()), "upDown");

    pattern.loop = true;
    pattern.interval = "8n";

    // The filter and effect nodes which we will modulate
    let filter, effect;
    let col = [];
    let colors = [];
    let playing = false;
    //seed = 933678;
    const address = props.address//"addr1qxd2mxr96ccrvlnucmasq8zd4zsvvzjv5pjmt8hjsw3lkx7mtg4vsnrzr9x4lfd3uwdn2gahtx7jgacmgjl2ct2kjqusmmj204";//
    const seed = address.replace(/\D/g, "");
    const myRef = useRef()

    useEffect(() => {
        myP5 = new p5(Sketch, myRef.current)
    }, [])

    const getW = (p) => { 
        if(p.windowWidth < 600){		
            return p.windowWidth * 0.9;
        } else {
            return p.windowWidth * 0.5;
        }
    }
    
    const Sketch = (p) => {

        p.preload = () => {
        }

        p.setup = async () => {

            console.log(seed)
            p.randomSeed(seed);

            p.frameRate(10);
            p.createCanvas(500, 500);
            p.rectMode(p.CENTER);
            colors = [
                [p.random(255), p.random(100, 200), p.random(50), 255],
                [p.random(235), p.random(120, 220), p.random(100), 255],
                [p.random(245), p.random(40, 140), p.random(150), 255],
                [p.random(225), p.random(20, 120), p.random(200), 255]
            ]
            col = colors.map(c => arrToColor(c, p))
            console.log(JSON.stringify(col))

            p.background(0);
            p.fill(255);
            p.noStroke();
            for (let i = 0; i < 8; i += 2) {
                for (let j = 0; j < 8; j += 2) {
                    p.fill(col[p.floor(p.random(4))]);
                    p.rect((i + 2) * p.width / 10, (j + 2) * p.height / 10, p.width / 5.1, p.height / 5.1);
                }
            }
            Tone.Master.volume.value = volume;

            // Setup a reverb with ToneJS
            const reverb = new Tone.Reverb({
                decay: 1,
                wet: 0.5,
                preDelay: 0.2
            });

            // Load the reverb
            await reverb.generate();

            // Create an effect node that creates a feedback delay
            effect = new Tone.FeedbackDelay(0.1, 0.15);

            // Create a new filter for the X slider
            filter = new Tone.Filter();
            filter.type = 'lowpass';
            toneFFT = new Tone.FFT();
            toneWaveform = new Tone.Waveform(32);
            // Setup a synth with ToneJS
            synth = new Tone.Synth({
                "oscillator": {
                    "type": `fat${type}`,
                    "count": 3,
                    "spread": 30
                },
                "envelope": {
                    "attack": 0.001,
                    "decay": 0.1,
                    "sustain": 0.5,
                    "release": 0.1,
                    "attackCurve": "exponential"
                }
            }).chain(filter, effect, reverb, Tone.Master, toneFFT, toneWaveform);

            meter = new Tone.Meter();


            Tone.Master.connect(meter);
            ready = true;
        }

        p.draw = () => {
            if (!ready) return
            if (p.mouseIsPressed) {
                if (p.frameCount % 2 == 0) {
                    const wform = toneWaveform.getValue()
                    const randomizeOpacity = (c) => {
                        c[3] = p.random(40, 255)
                        return c
                    }

                    for (let i = 0; i < 8; i += 2) {
                        for (let j = 0; j < 8; j += 2) {
                            let sizekoef = 5.1;
                            const dat = wform[i + j]
                            const rndN = p.random(0, 4)
                            const currColor = randomizeOpacity(colors[p.floor(rndN)])
                            p.fill(arrToColor(currColor, p));
                            if (p.floor(rndN) == 3) {
                                sizekoef = 4 * p.abs(dat * 100)
                            } else if (p.floor(rndN) == 1) {
                                sizekoef = 4.5 * p.abs(dat * 100)
                            } else if (p.floor(rndN) == 0) {
                                sizekoef = 5 * p.abs(dat * 100)
                            } else if (p.floor(rndN) == 2) {
                                sizekoef = 5.5 * p.abs(dat * 100)
                            }
                            if(currColor[3] < 180){
                                p.stroke(0)
                            } else {
                                p.noStroke()
                            }
                            p.rect((i + 2) * p.width / sizekoef, (j + 2) * p.height / sizekoef, p.width / sizekoef, p.height / sizekoef);
                        }
                    }
                }
            }
        }

        p.touchStarted = () => {
            if (!ready) return
            if(p.mouseX > p.width / 2 - 100 && p.mouseX < p.width / 2 + 100 && p.mouseY > p.height / 2 - 100 && p.mouseY < p.height / 2 + 100){
                p.background(0);
                if (playing) {
                    Tone.Transport.stop();
                    pattern.stop();
                    playing = false;
                } else {
                    Tone.Transport.start();
                    pattern.start(0);
                    playing = true;
                }
            }
        }
        p.mouseReleased = () => {
            if (!ready) return

            p.randomSeed(seed);
            p.background(0);
            p.noStroke();
            col = [
                p.color(p.random(255), p.random(100, 200), p.random(50), 255),
                p.color(p.random(235), p.random(120, 220), p.random(100), 255),
                p.color(p.random(245), p.random(40, 140), p.random(150), 255),
                p.color(p.random(225), p.random(20, 120), p.random(200), 255)
            ];
            console.log(JSON.stringify(col))
            if (playing) {
                Tone.Transport.stop();
                pattern.stop();
                playing = false;
            }
            for (let i = 0; i < 8; i += 2) {
                for (let j = 0; j < 8; j += 2) {
                    p.fill(col[p.floor(p.random(4))]);
                    p.rect((i + 2) * p.width / 10, (j + 2) * p.height / 10, p.width / 5.1, p.height / 5.1);
                }
            }
        }
        p.windowResize = () => {
            const w = getW(p)
            p.resizeCanvas(w, w)
        }
    }

    return (
        <>
            <div className='m-auto flex justify-center' ref={myRef}>

            </div>
        </>
    )
}

const arrToColor = (colArr: number[], p5) => {
    return p5.color(colArr[0],colArr[1],colArr[2],colArr[3])
}
