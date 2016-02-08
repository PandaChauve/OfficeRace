/**
 * Created by Panda_2 on 01-02-16.
 */

export class DroneBodyState{
    allowSleep: boolean;
    angle: number;
    angularDamping: number;
    angularForce: number;
    angularVelocity: number;
    collidesWith: Phaser.Physics.P2.CollisionGroup[];
    collideWorldBounds: boolean;
    damping: number;
    rotation: number;
    velocity: Phaser.Physics.P2.InversePointProxy;
    x: number;
    y: number;
}