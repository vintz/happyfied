import {VzApified, VzSocketified, SOCKET_EVENT} from './index';

import * as io from 'socket.io-client'

const api = new VzApified(2010);

class Socket1 extends VzSocketified
{
    constructor(api: VzApified)
    {
        super(api);
    }

    @SOCKET_EVENT()
    public connection(socket, self)
    {
        socket.emit('connected');
    }

    @SOCKET_EVENT()
    public test(data1: string, socket, self, data: {})
    {
        const data2 = self.innerTest(data1, data);
        socket.emit('test', data2);
    }

    private innerTest(data1: string, data: {})
    {
        return {datatest: data, data1test: data1};
    }

}


console.log('1')
const sck = new Socket1(api);
console.log('2')
const sock = io.connect('http://localhost:2010');
console.log('3')
sock.on('test', (data)=>
{
    console.log('-*-*-*-*-*-*-');
    console.log(data);
    console.log('-*-*-*-*-*-*-');

})
console.log('4')
sock.on('connected', ()=>
{
    sock.emit('test', 'titi', {info:'info'});
})
console.log('5')

sock.emit('test', 'titi***', {info:'info'});