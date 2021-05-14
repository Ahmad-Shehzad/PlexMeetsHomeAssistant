/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from 'axios';
import _ from 'lodash';

class Plex {
	ip: string;

	port: number;

	token: string;

	protocol: string;

	serverInfo: Record<string, any> = {};

	clients: Array<Record<string, any>> = [];

	requestTimeout = 5000;

	constructor(ip: string, port = 32400, token: string, protocol: 'http' | 'https' = 'http') {
		this.ip = ip;
		this.port = port;
		this.token = token;
		this.protocol = protocol;
	}

	init = async (): Promise<void> => {
		await this.getClients();
		/*
		setInterval(() => {
			this.getClients();
		}, 30000);
		*/
	};

	getClients = async (): Promise<Record<string, any>> => {
		const url = `${this.protocol}://${this.ip}:${this.port}/clients?X-Plex-Token=${this.token}`;
		try {
			const result = await axios.get(url, {
				timeout: this.requestTimeout
			});
			this.clients = result.data.MediaContainer.Server;
		} catch (err) {
			throw Error(`${err.message} while requesting URL "${url}".`);
		}
		return this.clients;
	};

	getServerID = async (): Promise<any> => {
		if (_.isEmpty(this.serverInfo)) {
			await this.getServerInfo();
		}
		return this.serverInfo.machineIdentifier;
	};

	getServerInfo = async (): Promise<any> => {
		const url = `${this.protocol}://${this.ip}:${this.port}/?X-Plex-Token=${this.token}`;
		this.serverInfo = (
			await axios.get(url, {
				timeout: this.requestTimeout
			})
		).data.MediaContainer;
		return this.serverInfo;
	};

	getSections = async (): Promise<any> => {
		const url = `${this.protocol}://${this.ip}:${this.port}/library/sections?X-Plex-Token=${this.token}`;
		return (
			await axios.get(url, {
				timeout: this.requestTimeout
			})
		).data.MediaContainer.Directory;
	};

	getSectionsData = async (): Promise<any> => {
		const sections = await this.getSections();
		const sectionsRequests: Array<Promise<any>> = [];
		_.forEach(sections, section => {
			sectionsRequests.push(
				axios.get(
					`${this.protocol}://${this.ip}:${this.port}/library/sections/${section.key}/all?X-Plex-Token=${this.token}`,
					{
						timeout: this.requestTimeout
					}
				)
			);
		});
		return this.exportSectionsData(await Promise.all(sectionsRequests));
	};

	getLibraryData = async (id: number): Promise<any> => {
		const url = `${this.protocol}://${this.ip}:${this.port}/library/metadata/${id}/children?X-Plex-Token=${this.token}`;
		return (
			await axios.get(url, {
				timeout: this.requestTimeout
			})
		).data.MediaContainer.Metadata;
	};

	private exportSectionsData = (sectionsData: Array<any>): Array<any> => {
		const processedData: Array<any> = [];
		_.forEach(sectionsData, sectionData => {
			processedData.push(sectionData.data.MediaContainer);
		});
		return processedData;
	};
}

export default Plex;
